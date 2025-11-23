import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, organization_id } = await req.json();

    if (!url || !organization_id) {
      throw new Error("URL and organization_id are required");
    }

    // 1. Jina Reader (Web Scraping)
    console.log(`[Ghostwriter] Scraping URL: ${url}`);
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Authorization": `Bearer ${Deno.env.get("JINA_API_KEY") || ""}`
      }
    });
    
    if (!jinaRes.ok) {
      throw new Error("Failed to scrape website content");
    }
    const markdown = await jinaRes.text();

    // 2. Gemini 2.0 Flash (AI Processing)
    console.log(`[Ghostwriter] Processing content with Gemini 2.0 Flash`);
    const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
    You are an AI data analyst. Extract information from the website markdown below and return PURE JSON.
    Do not use Markdown formatting (no \`\`\`json). Just return the raw JSON string.

    Target Schema:
    {
      "organization": {
        "name": "string",
        "description": "string",
        "representative_name": "string",
        "address_street": "string",
        "website_url": "string",
        "phone": "string"
      },
      "services": [
        { "name": "string", "description": "string", "price_range": "string" }
      ],
      "faqs": [
        { "question": "string", "answer": "string" }
      ]
    }

    Website Content:
    ${markdown.substring(0, 20000)}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up JSON (remove backticks if AI adds them)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const structuredData = JSON.parse(text);

    console.log(`[Ghostwriter] Successfully generated data for: ${structuredData.organization?.name}`);

    // 3. Database Operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if organization data is protected
    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("data_status")
      .eq("id", organization_id)
      .single();

    if (existingOrg && existingOrg.data_status === 'user_verified') {
      return new Response(
        JSON.stringify({ status: "skipped", message: "Protected data exists" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update organization data
    await supabase.from("organizations").update({
        name: structuredData.organization?.name,
        description: structuredData.organization?.description,
        representative_name: structuredData.organization?.representative_name,
        address_street: structuredData.organization?.address_street,
        website_url: url,
        phone: structuredData.organization?.phone,
        data_status: 'ai_generated',
        updated_at: new Date().toISOString()
    }).eq("id", organization_id);

    // Update services data
    await supabase.from("services").delete().eq("organization_id", organization_id);
    if (structuredData.services?.length) {
        await supabase.from("services").insert(
            structuredData.services.map((service: any) => ({
                organization_id,
                name: service.name,
                description: service.description,
                price_range: service.price_range,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))
        );
    }

    // Update FAQs data
    await supabase.from("faqs").delete().eq("organization_id", organization_id);
    if (structuredData.faqs?.length) {
        await supabase.from("faqs").insert(
            structuredData.faqs.map((faq: any) => ({
                organization_id,
                question: faq.question,
                answer: faq.answer,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }))
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: structuredData,
        source_url: url,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error(`[Ghostwriter] Error:`, error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});