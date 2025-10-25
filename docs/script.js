// script.js
const form = document.getElementById("leadForm");
const responseMessage = document.getElementById("responseMessage");
const submitBtn = form.querySelector(".submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");

// Reemplaza con la URL de tu Edge Function
const SUPABASE_FUNCTION_URL =
  "https://nahofxjfwfvhawyxnnjw.supabase.co/functions/v1/submit-lead";

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Show loading state
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline-block";
  responseMessage.className = "response-message";
  responseMessage.style.display = "none";

  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5haG9meGpmd2Z2aGF3eXhubmp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDE0MzcsImV4cCI6MjA3NjgxNzQzN30.Zx50xO0cmJKMPpgJ__JnEn_MPwzStZpLV1iqTy_tLFA",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "An unknown error occurred");
    }

    // Show success message
    responseMessage.textContent = "Success! Thank you for your submission.";
    responseMessage.className = "response-message success";
    form.reset();
  } catch (error) {
    // Show error message
    responseMessage.textContent = `Error: ${error.message}`;
    responseMessage.className = "response-message error";
  } finally {
    // Reset button state
    submitBtn.disabled = false;
    btnText.style.display = "inline-block";
    btnLoader.style.display = "none";
  }
});
