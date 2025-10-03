// --- MOCK PERFORMANCE DATA ---
const generateMockPerformance = (): { date: string; value: number }[] => {
  const data = [];
  let value = 100;
  for (let i = 0; i < 36; i++) {
    const date = new Date(2023, 0, 1);
    date.setMonth(date.getMonth() + i);
    value *= 1 + (Math.random() - 0.45) * 0.1;
    data.push({
      date: date.toLocaleDateString("en-US", {
        year: "2-digit",
        month: "short",
      }),
      value,
    });
  }
  return data;
};
const mockPortfolioData = generateMockPerformance();
const mockSP500Data = generateMockPerformance();

export { mockPortfolioData, mockSP500Data };
