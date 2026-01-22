export async function callGemini(prompt: string): Promise<string> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error ?? "Erreur API Gemini");
  }

  return data.text;
}
