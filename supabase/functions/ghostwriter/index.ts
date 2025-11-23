import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { url, organization_id } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!url || !apiKey) throw new Error("Missing URL or API Key");

    // 1. Jina Reader
    const jinaRes = await fetch(`https://r.jina.ai/${url}`, {
      headers: { "Authorization": `Bearer ${Deno.env.get("JINA_API_KEY") || ""}` }
    });
    const markdown = await jinaRes.text();

    // 2. Gemini API (Try 1.5 Flash)
    const targetModel = "gemini-1.5-flash";
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;
    
    const prompt = `Extract company info from this markdown as JSON (no markdown code blocks, just raw JSON): ${markdown.substring(0, 10000)}`;

    const genRes = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!genRes.ok) {
      // ★診断モード: 失敗したらモデル一覧を見に行く
      console.error(`Model ${targetModel} failed. Listing available models...`);
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      const availableModels = listData.models ? listData.models.map((m: any) => m.name) : "No models found";
      
      throw new Error(`Gemini 404. Available models for this key: ${JSON.stringify(availableModels)}`);
    }

    // 成功時の処理
    const genJson = await genRes.json();
    let text = genJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(text);

    // DB保存処理（簡略化）
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Organization Updateのみ実装（テスト用）
    await supabase.from("organizations").update({
        data_status: 'ai_generated',
        name: data.organization?.name
    }).eq("id", organization_id);

    return new Response(JSON.stringify({ success: true, data, debug_model: targetModel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});