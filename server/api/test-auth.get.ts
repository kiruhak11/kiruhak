export default defineEventHandler(async (event) => {
  return {
    message: "Auth system is working",
    timestamp: new Date().toISOString(),
    public: true
  };
});
