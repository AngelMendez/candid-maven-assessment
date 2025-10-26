import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";

import { getPartnerApi } from "./routingService.ts";

Deno.test("Routing Logic Tests", async (t) => {
  await t.step("should route to EDU API for Education interest", () => {
    const lead = { interest: "Education", country: "MX" };
    const expectedApi = "https://api.example.com/educate";
    assertEquals(getPartnerApi(lead), expectedApi);
  });

  await t.step("should route to FIN API for Finance interest in the US", () => {
    const lead = { interest: "Finance", country: "US" };
    const expectedApi = "https://api.example.com/finance";
    assertEquals(getPartnerApi(lead), expectedApi);
  });

  await t.step(
    "should route to fallback API if country is not US for Finance",
    () => {
      const lead = { interest: "Finance", country: "CA" };
      const expectedApi = "https://api.example.com/insurance";
      assertEquals(getPartnerApi(lead), expectedApi);
    }
  );

  await t.step("should route to fallback API for any other interest", () => {
    const lead = { interest: "Health", country: "US" };
    const expectedApi = "https://api.example.com/insurance";
    assertEquals(getPartnerApi(lead), expectedApi);
  });
});
