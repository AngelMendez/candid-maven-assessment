import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  createClient,
  SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2";
import { getPartnerApiFromRules } from "../_shared/routingService.ts"; // Reusing our routing service

// Constant to define the maximum number of retries
const MAX_ATTEMPTS = 3;

/**
 * Helper to finalize processing and write to the analytics log.
 * @param supabaseClient - The Supabase client.
 * @param queueId - The ID of the item in the queue.
 * @param finalStatus - The final status ('processed' or 'failed').
 * @param logData - The data to insert into the logs table.
 */
async function finalizeProcessing(
  supabaseClient: SupabaseClient,
  queueId: string,
  finalStatus: "processed" | "failed",
  logData: Record<string, any>
) {
  // Updates the status of the item in the processing queue
  await supabaseClient
    .from("lead_processing_queue")
    .update({
      status: finalStatus,
      processing_log: logData.error_message || "Success",
    })
    .eq("id", queueId);

  // Inserts the final result into the logs table for the dashboards
  await supabaseClient.from("submission_logs").insert(logData);
}

serve(async (req) => {
  // This function is invoked by a database trigger or webhook
  const { record: queueItem } = await req.json();

  // We use the SERVICE_ROLE_KEY so the function has admin permissions
  // to securely update the database.
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // 1. Mark the job as 'processing' to prevent another worker from taking it
    // and update the attempt counter.
    const { error: updateError } = await supabaseClient
      .from("lead_processing_queue")
      .update({
        status: "processing",
        attempts: (queueItem.attempts || 0) + 1,
        last_attempt_at: new Date().toISOString(),
      })
      .eq("id", queueItem.id);

    if (updateError) throw updateError;

    const leadPayload = queueItem.payload;

    // 2. Get the partner API using dynamic rules
    const partner = await getPartnerApiFromRules(supabaseClient, leadPayload);

    // 3. Call the external partner API
    const partnerResponse = await fetch(partner.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...leadPayload,
        submissionId: queueItem.id, // Good practice: send our internal ID
      }),
    });

    if (!partnerResponse.ok) {
      const errorBody = await partnerResponse.text();
      throw new Error(
        `Partner API (${partner.name}) returned status ${partnerResponse.status}: ${errorBody}`
      );
    }

    // 4. Success: Finalize and log the result
    await finalizeProcessing(supabaseClient, queueItem.id, "processed", {
      status: "SUCCESS",
      partner_api: partner.name,
    });

    return new Response(JSON.stringify({ status: "success" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const currentAttempts = queueItem.attempts || 0;

    if (currentAttempts < MAX_ATTEMPTS) {
      // 5a. Failure with retries remaining: Return to 'pending' to retry.
      await supabaseClient
        .from("lead_processing_queue")
        .update({ status: "pending", processing_log: error.message })
        .eq("id", queueItem.id);
    } else {
      // 5b. Failure without retries: Mark as 'failed' (Dead-Letter Queue).
      await finalizeProcessing(supabaseClient, queueItem.id, "failed", {
        status: "FAILED_AFTER_RETRIES",
        error_message: error.message,
        partner_api: "UNKNOWN",
      });
    }

    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200, // We return 200 so the trigger doesn't think it failed
      }
    );
  }
});
