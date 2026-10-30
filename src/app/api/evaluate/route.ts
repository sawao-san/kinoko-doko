import { NextResponse } from "next/server";

// フォールバック用のSVG図鑑イラスト生成（APIキー未設定時など）
function createFallbackMushroomSvgDataUrl(topic: string, mushroomName: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#064e3b"/>
        <stop offset="50%" stop-color="#0f766e"/>
        <stop offset="100%" stop-color="#1e293b"/>
      </linearGradient>
      <radialGradient id="cap" cx="50%" cy="35%" r="55%">
        <stop offset="0%" stop-color="#d97706"/>
        <stop offset="70%" stop-color="#92400e"/>
        <stop offset="100%" stop-color="#451a03"/>
      </radialGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#34d399" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="800" height="500" fill="url(#bg)"/>
    <!-- 信州の山並み -->
    <polygon points="0,360 160,210 310,330 480,180 650,310 800,220 800,500 0,500" fill="#022c22" opacity="0.6"/>
    <polygon points="0,390 220,260 410,360 600,240 800,350 800,500 0,500" fill="#064e3b" opacity="0.8"/>
    <!-- 地中・菌糸ネットワーク -->
    <rect x="0" y="370" width="800" height="130" fill="#1c1917" opacity="0.88"/>
    <g stroke="#38bdf8" stroke-width="2" opacity="0.7" fill="none" stroke-dasharray="5,5">
      <path d="M400,370 C340,410 240,430 140,460"/>
      <path d="M400,370 C380,430 350,460 290,485"/>
      <path d="M400,370 C450,420 540,440 660,465"/>
      <path d="M400,370 C420,430 470,465 520,490"/>
    </g>
    <circle cx="400" cy="300" r="160" fill="url(#glow)"/>
    <!-- キノコの柄 -->
    <path d="M365,240 C360,300 355,345 370,380 L430,380 C445,345 440,300 435,240 Z" fill="#fef3c7" stroke="#d6d3d1" stroke-width="2"/>
    <!-- キノコの傘 -->
    <path d="M250,245 C250,145 550,145 550,245 C480,260 320,260 250,245 Z" fill="url(#cap)" stroke="#fde68a" stroke-width="2"/>
    <!-- 胞子・雨粒エフェクト -->
    <circle cx="290" cy="140" r="4" fill="#a7f3d0" opacity="0.8"/>
    <circle cx="510" cy="130" r="5" fill="#fde68a" opacity="0.8"/>
    <circle cx="460" cy="100" r="3.5" fill="#a7f3d0" opacity="0.7"/>
    <circle cx="330" cy="105" r="3.5" fill="#bae6fd" opacity="0.8"/>
    <!-- ラベル -->
    <rect x="24" y="20" width="320" height="58" rx="12" fill="#0f172a" opacity="0.75"/>
    <text x="42" y="45" fill="#fde68a" font-size="15" font-family="sans-serif" font-weight="bold">🍌 Nano Banana 生態ビジュアル図鑑</text>
    <text x="42" y="66" fill="#e2e8f0" font-size="13" font-family="sans-serif">${mushroomName} - ${topic.slice(0, 20)}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf-8").toString("base64")}`;
}

// Nano Banana (gemini-nano-banana-2.1) で手書き絵＋説明から画像を生成するヘルパー
async function generateImageWithNanoBanana(params: {
  apiKey: string;
  topic: string;
  transcript: string;
  base64Data: string | null;
}): Promise<{ imageUrl: string | null; promptUsed: string; modelUsed: string }> {
  const { apiKey, topic, transcript, base64Data } = params;

  const imagePrompt = `ユーザーがホワイトボードに描いたキノコの絵・図解をベースに、長野県（信州）の豊かな森林生態系の中で育つキノコの美しくわかりやすい自然科学イラスト（図鑑クオリティ）を生成してください。
テーマ: ${topic}
ユーザーの説明: ${transcript || "信州の森林に生息するキノコと地下の菌糸ネットワーク"}
描かれた絵の構図や特徴（傘の形、柄、菌糸、周囲の木々や雨など）を活かしつつ、鮮やかで魅力的なビジュアルに仕上げてください。`;

  // 1. まず Interactions API (gemini-nano-banana-2.1) を試行
  try {
    const inputContent: any[] = [{ type: "text", text: imagePrompt }];
    if (base64Data) {
      inputContent.push({
        type: "image",
        mime_type: "image/png",
        data: base64Data,
      });
    }

    const interactionRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
          "Api-Revision": "2026-05-20",
        },
        body: JSON.stringify({
          model: "gemini-nano-banana-2.1",
          input: inputContent,
        }),
      }
    );

    if (interactionRes.ok) {
      const interactionData = await interactionRes.json();
      // SDKの output_image 相当、または REST の steps 配列から画像パートを抽出
      if (interactionData.output_image?.data) {
        const mime = interactionData.output_image.mime_type || "image/png";
        return {
          imageUrl: `data:${mime};base64,${interactionData.output_image.data}`,
          promptUsed: imagePrompt,
          modelUsed: "gemini-nano-banana-2.1 (interactions)",
        };
      }
      if (Array.isArray(interactionData.steps)) {
        for (const step of interactionData.steps) {
          if (Array.isArray(step.content)) {
            for (const item of step.content) {
              if (item.type === "image" && item.data) {
                const mime = item.mime_type || item.mimeType || "image/jpeg";
                return {
                  imageUrl: `data:${mime};base64,${item.data}`,
                  promptUsed: imagePrompt,
                  modelUsed: "gemini-nano-banana-2.1",
                };
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Nano Banana interactions API fallback to generateContent:", err);
  }

  // 2. フォールバックとして generateContent エンドポイント (gemini-nano-banana-2.1) を試行
  try {
    const parts: any[] = [{ text: imagePrompt }];
    if (base64Data) {
      parts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    }

    const genRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-nano-banana-2.1:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    if (genRes.ok) {
      const genData = await genRes.json();
      const candParts = genData.candidates?.[0]?.content?.parts || [];
      for (const part of candParts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || "image/jpeg";
          return {
            imageUrl: `data:${mime};base64,${part.inlineData.data}`,
            promptUsed: imagePrompt,
            modelUsed: "gemini-nano-banana-2.1",
          };
        }
      }
    }
  } catch (err) {
    console.error("Nano Banana generateContent error:", err);
  }

  return {
    imageUrl: null,
    promptUsed: imagePrompt,
    modelUsed: "fallback",
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, transcript, imageBase64, action } = body;

    if (!topic) {
      return NextResponse.json({ error: "お題が指定されていません" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const base64Data = imageBase64 ? imageBase64.replace(/^data:image\/\w+;base64,/, "") : null;

    // 単独で「Nano Banana画像生成のみ」リクエストされた場合
    if (action === "generate_image") {
      if (!apiKey) {
        await new Promise((r) => setTimeout(r, 800));
        return NextResponse.json({
          nanoBananaImage: createFallbackMushroomSvgDataUrl(topic, "信州キノコ"),
          nanoBananaModel: "gemini-nano-banana-2.1 (mock)",
        });
      }
      const nanoResult = await generateImageWithNanoBanana({
        apiKey,
        topic,
        transcript: transcript || "",
        base64Data,
      });
      return NextResponse.json({
        nanoBananaImage:
          nanoResult.imageUrl || createFallbackMushroomSvgDataUrl(topic, "信州キノコ"),
        nanoBananaModel: nanoResult.modelUsed,
        nanoBananaPrompt: nanoResult.promptUsed,
      });
    }

    // APIキーがない場合のフォールバック
    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const fallbackMushroom = "マツタケ / 菌根菌";
      return NextResponse.json({
        score: 90,
        mushroomName: fallbackMushroom,
        recommendedFolder: "菌根菌・共生メカニズム",
        summary: `『${topic}』について、描かれた絵と説明の両面からキノコの発生メカニズムが明快に表現されています！Nano Bananaによる図鑑ビジュアル化と長野県内の生息地まとめも生成しました。`,
        nanoBananaImage: createFallbackMushroomSvgDataUrl(topic, fallbackMushroom),
        nanoBananaModel: "gemini-nano-banana-2.1 (mock)",
        drawingEvaluation: {
          score: 89,
          comment:
            "キノコの傘・柄のフォルムと、地下の菌糸ネットワークから地上へ伸びる矢印の構造が視覚的にとてもわかりやすく描かれています！",
          goodPoints: [
            "地中の菌糸と地上の子実体（キノコ）の上下関係が一目でわかる構図になっている点。",
            "色分けや矢印によって水分吸収から成長への流れが直感的に表現されている点。",
          ],
          improvementPoints: [
            "共生する樹木（アカマツやコナラなど）の根っこを隣に描き足すと、菌根菌の仕組みがさらに伝わります！",
          ],
        },
        explanationEvaluation: {
          score: 91,
          comment:
            "秋雨による水分供給と地温の低下がトリガーになって一気に膨張・成長するという因果関係が、専門用語を噛み砕いて説明できています！",
          goodPoints: [
            "「なぜ雨の後に一斉に生えるのか」の理由が論理的なステップで語られている点。",
            "初心者や子供にもイメージしやすい言葉選びができている点。",
          ],
          improvementPoints: [
            "「雨が降ってから約2〜3日後に発生する」という具体的な日数の目安を加えると完璧です！",
          ],
        },
        naganoHabitatSummary: {
          overview:
            "長野県（信州）は標高差が大きく、北信の豪雪ブナ林から東信・南信の乾燥したアカマツ林まで多様な森林があるため、日本有数のキノコ生息地です。特にこのキノコは水はけの良い尾根筋や適度な湿気をもつ混交林に多く分布します。",
          bestSeason: "9月中旬〜10月下旬（秋雨前線の通過後、地温が15〜18℃に下がったタイミング）",
          preferredEnvironment: "標高 600〜1,200m のアカマツ林・コナラ・ミズナラ混交林（風通しが良く水はけの良い斜面）",
          regionalGuide: {
            hokushin: "【北信エリア】信濃町（黒姫山麓）・飯綱高原・志賀高原周辺。ブナやミズナラ林が豊富で、ナメコ・マイタケ・ハナイグチが濃厚に発生。",
            toshin: "【東信エリア】上田市（真田・別所）・佐久・軽井沢周辺。降水量が少なく日照時間が長いため、アカマツ林に最高級のマツタケやショウロが群生。",
            chushin: "【中信エリア】松本市（四賀・奈川）・安曇野・乗鞍高原周辺。標高差のあるカラマツ・シラカバ林にハナイグチ（リコボウ）やタマゴタケが豊富。",
            nanshin: "【南信エリア】伊那谷・木曽駒高原・下伊那（喬木村・豊丘村）周辺。温暖さと急峻な花崗岩土壌が重なり、全国トップクラスのマツタケ・ホンシメジ産地。",
          },
        },
        agents: {
          kid: {
            name: "👦 小学生エージェント（そうた君）",
            comment:
              "「普段は地下で細い糸みたいに隠れてて、雨が降ると水風船みたいに一気に膨らんでニョキニョキ生えるんだね！絵もNano Bananaの画像もすごくわかりやすい！」",
            clarityScore: 90,
          },
          expert: {
            name: "🍄 キノコ生態学エージェント（信州キノコ研究所）",
            comment:
              "「地下菌糸体（マイセリウム）が広大なネットワークを作り、十分な水分と地温低下をトリガーに子実体を形成する因果関係が正確に整理されています。」",
            accuracyScore: 92,
          },
          sensei: {
            name: "✍️ 赤ペン統括先生",
            comment:
              "絵と説明のバランスが抜群です！フォルダに保存して、信州キノコ図鑑コレクションとしていつでも見返せるようにしましょう。",
          },
        },
        habitatLocations: [
          {
            name: "上田市・真田の赤松林",
            area: "東信",
            lat: 36.42,
            lng: 138.3,
            altitude: "標高 600〜850m",
            treeType: "アカマツ・コナラ混交林",
            season: "9月下旬〜10月中旬",
            description: "信州を代表するマツタケの名産地。秋雨の後の地温低下時に一斉発生します。",
            probability: "発生確率: 88% (降雨後3日目)",
          },
          {
            name: "信濃町・黒姫山麓の原生林",
            area: "北信",
            lat: 36.81,
            lng: 138.15,
            altitude: "標高 700〜1,100m",
            treeType: "ミズナラ・ブナ林",
            season: "9月中旬〜11月上旬",
            description: "湿潤な黒土と豊かな下草があり、ナメコやマイタケ、ボリボリが群生します。",
            probability: "発生確率: 82%",
          },
          {
            name: "松本市・四賀地区の里山アカマツ林",
            area: "中信",
            lat: 36.31,
            lng: 137.99,
            altitude: "標高 650〜900m",
            treeType: "アカマツ・カラマツ林",
            season: "9月下旬〜10月下旬",
            description: "花崗岩質の風化土壌が広がり、マツタケやハナイグチ（リコボウ）の好適地です。",
            probability: "発生確率: 84%",
          },
          {
            name: "下伊那郡・豊丘村＆木曽駒山麓",
            area: "南信",
            lat: 35.55,
            lng: 137.9,
            altitude: "標高 550〜1,000m",
            treeType: "アカマツ・ツガ林",
            season: "10月上旬〜11月上旬",
            description: "南信州を代表する大産地。秋が深まる時期に香り高いキノコが多発します。",
            probability: "発生確率: 90%",
          },
        ],
        goodPoints: [
          "絵：地下の菌糸から地上のキノコへの成長プロセスが視覚的に描かれている点。",
          "説明：水分の吸収が単なる成長ではなく『細胞膨張』である点に着目している点。",
        ],
        redPenAdvice: [
          "【絵のアドバイス】共生する樹木（アカマツ、ブナ、シラカバ）の根元や落ち葉を描き足そう！",
          "【説明のアドバイス】水分だけでなく『気温の低下（刺激）』がトリガーになる点も添えると完璧です。",
        ],
        feynmanCheck: {
          simplicity: 89,
          structure: 90,
          clarity: 91,
        },
        mode: "mock_mushroom",
      });
    }

    // Google Gemini 3.8 Flash による「絵の評価」「説明の評価」「長野県の生息地まとめ」の解析
    const systemPrompt = `
あなたは長野県（信州）のキノコ生態学の世界的権威であり、ファインマン・テクニックのマスター「キノコ専門家AI」です。
ユーザーが【お題: ${topic}】について、キャンバスに絵（図解・イラスト）を描き、音声・テキストで説明しました。

【ユーザーの説明内容】:
${transcript || "（音声・テキスト説明なし - 描かれた絵のみ）"}

添付された「ユーザーが描いた絵（キャンバス画像）」と「説明内容」の両方をしっかり観察・分析し、必ず以下のJSONフォーマットのみを出力してください。Markdownコードブロック構文（\`\`\`json等）は含めず、純粋なJSON文字列のみを出力してください。

【重要な審査・出力要件】:
1. "drawingEvaluation"（絵の評価）: 添付されたキャンバス画像に描かれているキノコの形・色・構造・矢印・周囲の環境などを具体的に観察して採点（0〜100点）し、絵の良い点と改善アドバイスを記述してください。
2. "explanationEvaluation"（説明の評価）: ユーザーの説明文・図解の言葉を採点（0〜100点）し、小学生にもわかる平易さと生態学的な正確さの両面から、説明の良い点と改善アドバイスを記述してください。
3. "naganoHabitatSummary"（長野県のどこに生えているかのまとめ）: そのキノコ（またはお題に関連する信州の代表的キノコ）が長野県（信州）のどこに・いつ・どんな環境で生えているかを、全体概要と4地域（北信・東信・中信・南信）別に詳しくまとめてください。
4. "habitatLocations": 長野県内の具体的な生息地スポットを3〜4箇所（北信・東信・中信・南信からバランスよく）特定し、実在する地域名と緯度経度（lat: 35.3〜36.9, lng: 137.5〜138.6の範囲）を設定してください。
5. "recommendedFolder": 保存先フォルダの推奨カテゴリ名（"食用キノコ・名産", "毒キノコ・要注意", "菌根菌・共生メカニズム", "北信・東信エリア", "中信・南信エリア" のいずれか）を指定してください。

{
  "score": 88,
  "mushroomName": "解説対象のキノコ名（例: マツタケ、ベニテングタケ、ハナイグチ、ブナシメジなど）",
  "recommendedFolder": "食用キノコ・名産",
  "summary": "絵と説明を合わせた総合講評コメント（2〜3文）",
  "drawingEvaluation": {
    "score": 88,
    "comment": "描かれた絵・イラスト・図解に対する具体的な評価コメント（2〜3文）",
    "goodPoints": [
      "絵の良かった点1",
      "絵の良かった点2"
    ],
    "improvementPoints": [
      "絵をさらに良くするアドバイス1"
    ]
  },
  "explanationEvaluation": {
    "score": 90,
    "comment": "説明内容に対する具体的な評価コメント（2〜3文）",
    "goodPoints": [
      "説明の良かった点1",
      "説明の良かった点2"
    ],
    "improvementPoints": [
      "説明をさらに良くするアドバイス1"
    ]
  },
  "naganoHabitatSummary": {
    "overview": "長野県内でこのキノコがどこにどのように生えているかの全体まとめ（2〜3文）",
    "bestSeason": "長野県での発生時期（例: 9月中旬〜10月下旬の秋雨後）",
    "preferredEnvironment": "好む標高・樹木・土壌環境（例: 標高600〜1,000mのアカマツ林やコナラ混交林）",
    "regionalGuide": {
      "hokushin": "北信エリア（黒姫・戸隠・志賀高原・飯綱など）での生息特徴とスポット",
      "toshin": "東信エリア（上田・真田・軽井沢・佐久・八ヶ岳など）での生息特徴とスポット",
      "chushin": "中信エリア（松本・四賀・安曇野・乗鞍など）での生息特徴とスポット",
      "nanshin": "南信エリア（伊那・木曽・豊丘・駒ヶ根など）での生息特徴とスポット"
    }
  },
  "agents": {
    "kid": {
      "name": "👦 小学生エージェント（そうた君）",
      "comment": "絵と説明を見た子供目線の素直な感想（1〜2文）",
      "clarityScore": 88
    },
    "expert": {
      "name": "🍄 キノコ生態学エージェント（信州キノコ研究所）",
      "comment": "キノコ生態の正確性と長野県の生息条件に関する専門レビュー（1〜2文）",
      "accuracyScore": 92
    },
    "sensei": {
      "name": "✍️ 赤ペン統括先生",
      "comment": "絵と説明の総合評価と次へのアドバイス"
    }
  },
  "habitatLocations": [
    {
      "name": "スポット名（例: 上田市・真田のアカマツ林）",
      "area": "東信",
      "lat": 36.42,
      "lng": 138.30,
      "altitude": "標高 600〜850m",
      "treeType": "共生する樹木（例: アカマツ・コナラ林）",
      "season": "発生時期（例: 9月下旬〜10月中旬）",
      "description": "生息環境の特徴（なぜここに生えるか）",
      "probability": "発生確率: 85%"
    }
  ],
  "goodPoints": [
    "全体の良かった点1",
    "全体の良かった点2"
  ],
  "redPenAdvice": [
    "赤ペン添削1（絵や図解の改善点）",
    "赤ペン添削2（説明や生息条件の補足）"
  ],
  "feynmanCheck": {
    "simplicity": 88,
    "structure": 89,
    "clarity": 90
  }
}
`;

    const evalParts: any[] = [{ text: systemPrompt }];
    if (base64Data) {
      evalParts.push({
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      });
    }

    const evalApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    // Gemini 3.8 Flash による評価 と Nano Banana (gemini-nano-banana-2.1) による画像生成 を並列実行！
    const [evalResponse, nanoBananaResult] = await Promise.all([
      fetch(evalApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: evalParts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      }),
      generateImageWithNanoBanana({
        apiKey,
        topic,
        transcript: transcript || "",
        base64Data,
      }),
    ]);

    if (!evalResponse.ok) {
      const errText = await evalResponse.text();
      console.error("Gemini API error:", errText);
      throw new Error(`Gemini API error: ${evalResponse.statusText}`);
    }

    const data = await evalResponse.json();
    let candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    candidateText = candidateText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    const parsed = JSON.parse(candidateText);

    const finalNanoImage =
      nanoBananaResult.imageUrl ||
      createFallbackMushroomSvgDataUrl(topic, parsed.mushroomName || "信州キノコ");

    return NextResponse.json({
      ...parsed,
      nanoBananaImage: finalNanoImage,
      nanoBananaModel: nanoBananaResult.modelUsed,
      nanoBananaPrompt: nanoBananaResult.promptUsed,
      mode: "gemini_nano_banana_and_expert",
    });
  } catch (error: any) {
    console.error("Evaluation error:", error);
    return NextResponse.json(
      { error: "評価と画像生成中にエラーが発生しました", details: error.message },
      { status: 500 }
    );
  }
}
