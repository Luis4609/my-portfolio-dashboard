const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY as string;

export const getGeminiPortfolioAnalysis = async (
  portfolioData: any[]
): Promise<string> => {
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
  const systemPrompt = `Actúas como un analista financiero profesional...`;
  const userQuery = `Por favor, analiza esta cartera: ${JSON.stringify(
    portfolioData,
    null,
    2
  )}`;
  const payload = {
    contents: [{ parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    tools: [{ google_search: {} }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok)
      throw new Error(`Gemini API call failed: ${response.status}`);
    const result = await response.json();
    const analysisText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysisText) throw new Error("No content from Gemini API.");
    return analysisText;
  } catch (error) {
    console.error("Failed to get portfolio analysis:", error);
    return "Lo sentimos, no se pudo generar el análisis en este momento.";
  }
};

export const fetchEpsAPI = async (ticker: string): Promise<number | null> => {
  if (!ticker) return null;

  const url = `https://financialmodelingprep.com/api/v3/key-metrics-ttm/${ticker}?apikey=${FMP_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch EPS: ${response.status}`);
    const data = await response.json();
    const eps = data[0]?.epsdilutedTTM;
    return typeof eps === "number" ? eps : null;
  } catch (error) {
    console.error("Error fetching EPS:", error);
    return null;
  }
};
