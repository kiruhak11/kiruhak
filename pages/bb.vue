<template>
  <div class="bot-page">
    <h1>Block Blast Bot</h1>
    <div class="game-container">
      <div class="grid">
        <div
          v-for="(row, rowIndex) in gameGrid"
          :key="rowIndex"
          class="grid-row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            :class="['grid-cell', cell === 1 ? 'occupied' : '']"
          ></div>
        </div>
      </div>

      <div class="controls">
        <h2>Выберите фигуры</h2>
        <div class="shapes">
          <div
            v-for="shape in availableShapes"
            :key="shape.id"
            class="shape-preview"
            @click="selectShape(shape)"
          >
            <div
              v-for="(row, rowIndex) in shape.pattern"
              :key="rowIndex"
              class="shape-row"
            >
              <div
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                :class="['shape-cell', cell === 1 ? 'active-cell' : '']"
              ></div>
            </div>
          </div>
        </div>

        <div v-if="selectedShape" class="preview-container">
          <h2>Предпросмотр фигуры</h2>
          <div class="shape-preview">
            <div
              v-for="(row, rowIndex) in rotatedShape"
              :key="rowIndex"
              class="shape-row"
            >
              <div
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                :class="['shape-cell', cell === 1 ? 'active-cell' : '']"
              ></div>
            </div>
          </div>
          <button class="rotate-button" @click="rotateShape">Повернуть</button>
          <button class="reflect-button" @click="reflectShape">
            Отразить фигуру
          </button>

          <button class="confirm-button" @click="placeShape">
            Подтвердить
          </button>
        </div>
      </div>

      <div class="suggestion">
        <h2>Ход бота:</h2>
        <p>
          {{
            bestMove
              ? `Бот ставит в клетку (${bestMove.x}, ${bestMove.y})`
              : "Нет доступных ходов"
          }}
        </p>
      </div>

      <div v-if="isGameOver" class="game-over">
        <h2>Игра окончена!</h2>
        <button @click="resetGame" class="reset-button">Начать заново</button>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref, computed } from "vue";

interface Shape {
  id: number;
  name: string;
  pattern: number[][];
}

export default defineComponent({
  setup() {
    const availableShapes = ref<Shape[]>([
      {
        id: 1,
        name: "Квадрат 2x2",
        pattern: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 2,
        name: "Квадрат 3x3",
        pattern: [
          [1, 1, 1],
          [1, 1, 1],
          [1, 1, 1],
        ],
      },
      {
        id: 3,
        name: "Горизонтальная линия 5",
        pattern: [[1, 1, 1, 1, 1]],
      },
      {
        id: 4,
        name: "Горизонтальная линия 4",
        pattern: [[1, 1, 1, 1]],
      },
      {
        id: 5,
        name: "Горизонтальная линия 3",
        pattern: [[1, 1, 1]],
      },
      {
        id: 6,
        name: "Горизонтальная линия 2",
        pattern: [[1, 1]],
      },
      {
        id: 7,
        name: "Горизонтальная линия 1",
        pattern: [[1]],
      },
      {
        id: 8,
        name: "L-образная фигура",
        pattern: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
      },
      {
        id: 9,
        name: "Z-образная фигура",
        pattern: [
          [1, 1, 0],
          [0, 1, 1],
        ],
      },
      {
        id: 10,
        name: "Г",
        pattern: [
          [1, 1, 1],
          [1, 0, 0],
          [1, 0, 0],
        ],
      },
    ]);

    const selectedShape = ref<Shape | null>(null);
    const rotatedShape = ref<number[][] | null>(null);
    const gameGrid = ref<number[][]>(
      Array(10)
        .fill(null)
        .map(() => Array(10).fill(0))
    ); // Игровое поле 10x10
    const reflectShape = () => {
      if (rotatedShape.value) {
        rotatedShape.value = rotatedShape.value.map((row) => row.reverse());
      }
    };
    const selectShape = (shape: Shape) => {
      selectedShape.value = shape;
      rotatedShape.value = shape.pattern;
    };

    const rotateShape = () => {
      if (rotatedShape.value) {
        rotatedShape.value = rotatedShape.value[0].map((_, colIndex) =>
          rotatedShape.value!.map((row) => row[colIndex]).reverse()
        );
      }
    };

    const placeShape = () => {
      const bestMove = findBestMove();
      if (bestMove) {
        const { x, y, shapePattern } = bestMove;
        for (let i = 0; i < shapePattern.length; i++) {
          for (let j = 0; j < shapePattern[i].length; j++) {
            if (shapePattern[i][j] === 1) {
              gameGrid.value[x + i][y + j] = 1;
            }
          }
        }
        removeCompletedLines();
        selectedShape.value = null;
      }
      checkGameOver();
    };

    const findBestMove = () => {
      if (!rotatedShape.value) return null;

      let bestMove = null;

      for (
        let x = 0;
        x <= gameGrid.value.length - rotatedShape.value.length;
        x++
      ) {
        for (
          let y = 0;
          y <= gameGrid.value[0].length - rotatedShape.value[0].length;
          y++
        ) {
          if (canPlaceShape(x, y, rotatedShape.value)) {
            bestMove = {
              x,
              y,
              shapePattern: rotatedShape.value,
            };
            break;
          }
        }
        if (bestMove) break;
      }

      return bestMove;
    };

    const canPlaceShape = (x: number, y: number, pattern: number[][]) => {
      for (let i = 0; i < pattern.length; i++) {
        for (let j = 0; j < pattern[i].length; j++) {
          if (pattern[i][j] === 1 && gameGrid.value[x + i][y + j] === 1) {
            return false;
          }
        }
      }
      return true;
    };

    const removeCompletedLines = () => {
      // Удаление полных строк и столбцов
      for (let i = 0; i < 10; i++) {
        if (gameGrid.value[i].every((cell) => cell === 1)) {
          gameGrid.value[i] = Array(10).fill(0); // Очистить строку
        }
        if (gameGrid.value.every((row) => row[i] === 1)) {
          for (let j = 0; j < 10; j++) {
            gameGrid.value[j][i] = 0; // Очистить столбец
          }
        }
      }
    };

    const isGameOver = ref(false);

    const checkGameOver = () => {
      isGameOver.value = !availableShapes.value.some((shape) => {
        rotatedShape.value = shape.pattern;
        return !!findBestMove();
      });
    };

    const resetGame = () => {
      gameGrid.value = Array(10)
        .fill(null)
        .map(() => Array(10).fill(0));
      isGameOver.value = false;
    };

    return {
      reflectShape,
      availableShapes,
      selectShape,
      rotateShape,
      bestMove: computed(() => findBestMove()),
      isGameOver,
      resetGame,
      gameGrid,
      placeShape,
      rotatedShape,
      selectedShape,
    };
  },
});
</script>
<style lang="scss" scoped>
.reflect-button {
  margin-top: 10px;
  padding: 10px 20px;
  background-color: #f7b32b;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #e69f00;
  }
}

.bot-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #1e1e2f;
  color: #f5f5f5;
  min-height: 100vh;
  font-family: "Arial", sans-serif;

  h1 {
    margin-top: 20px;
    font-size: 36px;
    color: #f7b32b;
  }

  .game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    background-color: #2e2e3f;
    border-radius: 15px;
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(10, 40px);
    grid-template-rows: repeat(10, 40px);
    gap: 4px;
    margin: 20px 0;
  }

  .grid-cell {
    width: 40px;
    height: 40px;
    background-color: #454558;
    border: 1px solid #333;
  }

  .occupied {
    background-color: #f7b32b;
  }

  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .shapes {
    display: flex;
    margin: 10px 0;
  }

  .shape-preview {
    display: flex;
    flex-direction: column;
    margin-right: 10px;
    cursor: pointer;
  }

  .shape-row {
    display: flex;
  }

  .shape-cell {
    width: 20px;
    height: 20px;
    background-color: #6c757d;
    border: 1px solid #333;
    margin: 1px;
  }

  .active-cell {
    background-color: #f7b32b;
  }

  .preview-container {
    margin-top: 20px;
  }

  .rotate-button,
  .confirm-button,
  .reset-button {
    background-color: #f7b32b;
    color: #1e1e2f;
    border: none;
    border-radius: 5px;
    padding: 10px 20px;
    cursor: pointer;
    margin: 5px;
    transition: background-color 0.3s;

    &:hover {
      background-color: #e6a92b;
    }
  }

  .suggestion {
    margin-top: 20px;
  }

  .game-over {
    text-align: center;
  }
}
</style>
