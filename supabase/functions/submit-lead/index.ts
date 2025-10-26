import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// The validation schema remains the same to protect the input
const LeadSchema = z.object({
  name: z.string().min(1, { message: "Name cannot be empty" }),
  email: z.string().email({ message: "Invalid email format" }),
  interest: z.string().optional(),
  country: z.string().optional(), // We add country for routing logic
});

serve(async (req) => {
  // Handle preflight request (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const body = await req.json();

    // 1. Validate input data. This is fast and crucial.
    const leadData = LeadSchema.parse(body);

    // 2. Insert the lead into the processing queue with 'pending' status.
    // We don't wait for it to be processed, we just queue it.
    const { error } = await supabaseClient
      .from("lead_processing_queue")
      .insert({
        payload: leadData,
        status: "pending",
      });

    if (error) throw error;

    // 3. Respond immediately to the user with a '202 Accepted'.
    // This tells the frontend that we received the request and will process it.
    return new Response(
      JSON.stringify({
        message: "Submission received and is being processed.",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 202, // HTTP status code for 'Accepted'
      }
    );
  } catch (error) {
    console.log({ error });
    // Error handling now focuses primarily on validation
    const errorMessage =
      error instanceof z.ZodError
        ? error.errors.map((e) => e.message).join(", ")
        : "Could not accept submission.";

    const status = error instanceof z.ZodError ? 400 : 500;

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: status,
    });
  }
});
