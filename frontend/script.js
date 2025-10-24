// script.js
const form = document.getElementById("leadForm");
const responseMessage = document.getElementById("responseMessage");

// Reemplaza con la URL de tu Edge Function
const SUPABASE_FUNCTION_URL =
  "https://nahofxjfwfvhawyxnnjw.supabase.co/functions/v1/submit-lead";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  responseMessage.textContent = "Submitting...";

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // En un caso real, aquí iría la autenticación del usuario
        Authorization: "Bearer <tu_supabase_anon_key>",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "An unknown error occurred");
    }

    responseMessage.textContent = "Success! Thank you for your submission.";
    form.reset();
  } catch (error) {
    responseMessage.textContent = `Error: ${error.message}`;
  }
});
