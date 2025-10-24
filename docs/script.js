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
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haG9meGpmd2Z2aGF3eXhubmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDE0MzcsImV4cCI6MjA3NjgxNzQzN30.Zx50xO0cmJKMPpgJ__JnEn_MPwzStZpLV1iqTy_tLFA",
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
