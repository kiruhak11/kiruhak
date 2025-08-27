<template>
  <div v-if="isOpen" class="code-modal-overlay" @click="closeModal">
    <div class="code-modal" @click.stop>
      <div class="code-modal-header">
        <h3>{{ component?.name || "Код компонента" }}</h3>
        <button class="close-button" @click="closeModal">
          <span>&times;</span>
        </button>
      </div>

      <div class="code-modal-content">
        <div class="code-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            :class="['tab-button', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="code-content">
          <pre
            v-if="activeTab === 'html'"
            class="code-block html"
          ><code>{{ getHtmlCode() }}</code></pre>
          <pre
            v-else-if="activeTab === 'css'"
            class="code-block css"
          ><code>{{ getCssCode() }}</code></pre>
          <pre
            v-else-if="activeTab === 'js'"
            class="code-block js"
          ><code>{{ getJsCode() }}</code></pre>
        </div>

        <div class="code-actions">
          <button class="copy-button" @click="copyCode">
            <span v-if="!copied">📋 Копировать код</span>
            <span v-else>✅ Скопировано!</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  component: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["close"]);

const activeTab = ref("html");
const copied = ref(false);

const tabs = [
  { key: "html", label: "HTML" },
  { key: "css", label: "CSS" },
  { key: "js", label: "JavaScript" },
];

const closeModal = () => {
  emit("close");
};

// Функции для извлечения кода
const getHtmlCode = () => {
  // Используем новые поля, если они есть
  if (props.component?.html) {
    return props.component.html;
  }

  // Иначе парсим старый код
  if (!props.component?.code) return "";

  const code = props.component.code;

  // Удаляем CSS и JS из кода, оставляем только HTML
  return code
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();
};

const getCssCode = () => {
  // Используем новые поля, если они есть
  if (props.component?.css) {
    return props.component.css;
  }

  // Иначе парсим старый код
  if (!props.component?.code) return "/* CSS стили будут здесь */";

  const code = props.component.code;
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

  return styleMatch ? styleMatch[1].trim() : "/* CSS стили будут здесь */";
};

const getJsCode = () => {
  // Используем новые поля, если они есть
  if (props.component?.js) {
    return props.component.js;
  }

  // Иначе парсим старый код
  if (!props.component?.code) return "// JavaScript код будет здесь";

  const code = props.component.code;
  const scriptMatch = code.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  return scriptMatch ? scriptMatch[1].trim() : "// JavaScript код будет здесь";
};

const copyCode = async () => {
  let codeToCopy = "";

  switch (activeTab.value) {
    case "html":
      codeToCopy = getHtmlCode();
      break;
    case "css":
      codeToCopy = getCssCode();
      break;
    case "js":
      codeToCopy = getJsCode();
      break;
  }

  try {
    await navigator.clipboard.writeText(codeToCopy);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Ошибка копирования:", error);
    // Fallback для старых браузеров
    const textArea = document.createElement("textarea");
    textArea.value = codeToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
};
</script>

<style lang="scss" scoped>
.code-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.code-modal {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.code-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #111827;
  }
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }
}

.code-modal-content {
  padding: 0;
}

.code-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.tab-button {
  padding: 12px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;

  &:hover {
    color: #374151;
    background: #f3f4f6;
  }

  &.active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
    background: white;
  }
}

.code-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.code-block {
  margin: 0;
  padding: 16px;
  background: #1f2937;
  border-radius: 8px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #f9fafb;
  overflow-x: auto;

  code {
    color: inherit;
  }
}

.code-actions {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  display: flex;
  justify-content: flex-end;
}

.copy-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:active {
    transform: translateY(1px);
  }
}

@media (max-width: 768px) {
  .code-modal {
    margin: 10px;
    max-height: 90vh;
  }

  .code-content {
    max-height: 300px;
  }

  .code-tabs {
    flex-wrap: wrap;
  }

  .tab-button {
    flex: 1;
    min-width: 80px;
  }
}
</style>
