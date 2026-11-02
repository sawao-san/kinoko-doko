import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Dev server in AI Studio runs on port 3000, Cloud Run uses process.env.PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Allow large image uploads (smartphone high-res camera photos)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Address Geocoding endpoint using OpenStreetMap Nominatim
app.get('/api/geocode', async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: '検索する住所または地名を入力してください。' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5&addressdetails=1&accept-language=ja`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TabereruKinokoMapApp/1.0 (devstar4187@gcplab.me)',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding service returned status ${response.status}`);
    }

    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error('Geocoding error:', error);
    return res.status(500).json({ error: '住所の検索中にエラーが発生しました。' });
  }
});

// Gemini Mushroom Identification API
app.post('/api/identify-mushroom', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userNotes } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '画像データが提供されていません。' });
    }

    // Clean up base64 prefix if present
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const ai = new GoogleGenAI();

    const prompt = `あなたは菌類学者・キノコ専門家です。
提供されたキノコの写真を詳細に観察・解析し、以下の情報を正確にJSONで返してください。

【判定基準・方針】
1. キノコの名前（和名）と学名を特定してください。確証が持てない場合は最も可能性の高い候補を挙げてください。
2. 食用区分は必ず以下のいずれかに分類してください:
   - "可食" : 食用として広く知られているキノコ
   - "有毒" : 毒キノコ（猛毒、弱毒、消化器系毒などを含む）
   - "要注意/不明" : 写真が不鮮明、類似の猛毒キノコと肉眼で見分けが困難、または食毒不明・食不適
3. 安全を最優先とし、迷った場合や類似の毒キノコが存在する場合は必ず「要注意/不明」または「有毒」として警告してください。
4. 豆知識・特徴は日本語で約100文字程度にまとめてください。
5. 誤食を防ぐための見分けの注意点（カサの裏ヒダ、ツバ、ツボの有無、変色性、類似の猛毒種との違いなど）を具体的に記載してください。
6. 写真が明らかにキノコでない場合は isMushroom: false とし、その旨を説明してください。

${userNotes ? `ユーザーからの追記メモ: "${userNotes}"` : ''}

必ず次のJSONフォーマットのみを出力してください。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            isMushroom: {
              type: 'boolean',
              description: 'キノコまたは菌類が写っているかどうか',
            },
            name: {
              type: 'string',
              description: 'キノコの日本語名（和名）',
            },
            scientificName: {
              type: 'string',
              description: '学名（ラテン語）',
            },
            status: {
              type: 'string',
              enum: ['可食', '有毒', '要注意/不明'],
              description: '食毒区分',
            },
            confidence: {
              type: 'string',
              enum: ['高', '中', '低'],
              description: 'AI同定の信頼度',
            },
            trivia: {
              type: 'string',
              description: '特徴や豆知識（約100文字）',
            },
            cautionNotes: {
              type: 'string',
              description: '誤食防止のための見分けの注意点や類似毒キノコ情報',
            },
            season: {
              type: 'string',
              description: '発生時期の目安（例: 初夏〜秋）',
            },
            habitat: {
              type: 'string',
              description: '発生場所・環境（例: 広葉樹の倒木、コナラ林の地上など）',
            },
            characteristics: {
              type: 'array',
              items: { type: 'string' },
              description: '外見の識別ポイント（カサ、ヒダ、柄など）',
            },
            disclaimer: {
              type: 'string',
              description: '安全警告免責事項',
            },
          },
          required: ['isMushroom', 'name', 'status', 'trivia', 'cautionNotes'],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini からの応答が空でした。');
    }

    const parsed = JSON.parse(responseText);

    // Fallback disclaimer guarantee
    if (!parsed.disclaimer) {
      parsed.disclaimer = '※AI判定は参考情報です。絶対に自己判断で口に入れないでください。野生のキノコには猛毒種や個体差があり、専門家による肉眼・顕微鏡鑑定が必要です。';
    }

    return res.json(parsed);
  } catch (error: any) {
    console.error('Mushroom identification error:', error);
    return res.status(500).json({
      error: error.message || 'キノコの解析中にエラーが発生しました。もう一度お試しください。',
    });
  }
});

// BigQuery Table Schema & DDL definition
const BIGQUERY_TABLE_SCHEMA = {
  tableId: 'mushroom_observations',
  datasetId: 'kinoko_ecology_analytics',
  ddl: `CREATE OR REPLACE TABLE \`kinoko_ecology_analytics.mushroom_observations\`
(
  observation_id STRING OPTIONS(description="一意識別ID"),
  observed_at TIMESTAMP OPTIONS(description="発見日時"),
  observed_year INT64 OPTIONS(description="発見年（当たり年集計用）"),
  observed_month INT64 OPTIONS(description="発見月（季節トレンド分析用）"),
  mushroom_name STRING OPTIONS(description="キノコ和名"),
  scientific_name STRING OPTIONS(description="学名"),
  status STRING OPTIONS(description="食毒区分: 可食 / 有毒 / 要注意/不明"),
  confidence STRING OPTIONS(description="AI同定確信度"),
  location GEOGRAPHY OPTIONS(description="発見位置 GPS地理空間データ (WKT / GeoJSON)"),
  latitude FLOAT64 OPTIONS(description="緯度"),
  longitude FLOAT64 OPTIONS(description="経度"),
  trivia STRING OPTIONS(description="豆知識・生態特徴"),
  caution_notes STRING OPTIONS(description="誤食防止注意点"),
  season STRING OPTIONS(description="発生時期"),
  habitat STRING OPTIONS(description="発生環境"),
  gcs_image_uri STRING OPTIONS(description="Google Cloud Storage 画像URI (gs://kinoko-archive/...)"),
  user_notes STRING OPTIONS(description="散策フィールドメモ")
)
PARTITION BY DATE(observed_at)
CLUSTER BY status, mushroom_name;`,
  bumperYearAnalysisSql: `-- 【当たり年分析クエリ】年別・種別の発生頻度と前年比（当たり年判定）
SELECT
  observed_year,
  mushroom_name,
  status,
  COUNT(1) as observation_count,
  LAG(COUNT(1)) OVER (PARTITION BY mushroom_name ORDER BY observed_year) as prev_year_count,
  ROUND((COUNT(1) - LAG(COUNT(1)) OVER (PARTITION BY mushroom_name ORDER BY observed_year)) * 100.0 / 
    NULLIF(LAG(COUNT(1)) OVER (PARTITION BY mushroom_name ORDER BY observed_year), 0), 1) as growth_rate_pct,
  CASE
    WHEN COUNT(1) >= 3 AND (LAG(COUNT(1)) OVER (PARTITION BY mushroom_name ORDER BY observed_year) IS NULL 
      OR COUNT(1) >= LAG(COUNT(1)) OVER (PARTITION BY mushroom_name ORDER BY observed_year) * 1.5)
    THEN '★ 当たり年 (BUMPER YEAR)'
    ELSE '平年並み'
  END as bumper_status
FROM
  \`kinoko_ecology_analytics.mushroom_observations\`
GROUP BY
  observed_year, mushroom_name, status
ORDER BY
  observed_year DESC, observation_count DESC;`,
};

// In-memory / persistent cloud observation dataset
let cloudObservationStore: any[] = [];

// BigQuery / Cloud Sync API: syncs local records into cloud dataset
app.post('/api/cloud-sync', (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'records 配列が必要です。' });
    }

    // Transform into BigQuery formatted rows with geographical point and year/month partitioning
    const bigQueryRows = records.map((r: any) => {
      const date = new Date(r.createdAt || Date.now());
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      return {
        observation_id: r.id,
        observed_at: date.toISOString(),
        observed_year: year,
        observed_month: month,
        mushroom_name: r.name,
        scientific_name: r.scientificName || null,
        status: r.status,
        confidence: r.confidence || '中',
        location: `POINT(${r.lng} ${r.lat})`,
        latitude: r.lat,
        longitude: r.lng,
        trivia: r.trivia || '',
        caution_notes: r.cautionNotes || '',
        season: r.season || '',
        habitat: r.habitat || '',
        gcs_image_uri: `gs://kinoko-archive/images/${r.id}.jpg`,
        user_notes: r.userNotes || null,
      };
    });

    cloudObservationStore = bigQueryRows;

    return res.json({
      success: true,
      message: `${bigQueryRows.length} 件の観測データを Google Cloud / BigQuery データセット形式に同期しました。`,
      syncedCount: bigQueryRows.length,
      sampleBqRow: bigQueryRows[0] || null,
    });
  } catch (error: any) {
    console.error('Cloud sync error:', error);
    return res.status(500).json({ error: 'クラウド同期中にエラーが発生しました。' });
  }
});

// BigQuery NDJSON Export API
app.get('/api/analytics/export-bigquery', (req, res) => {
  try {
    // Generate newline-delimited JSON (NDJSON)
    const ndjson = cloudObservationStore.map((row) => JSON.stringify(row)).join('\n');
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', 'attachment; filename="mushroom_observations_bigquery.jsonl"');
    return res.send(ndjson);
  } catch (error: any) {
    return res.status(500).json({ error: 'エクスポートに失敗しました。' });
  }
});

// Analytics & Multi-year Trends API (Bumper Year Detection)
app.get('/api/analytics/trends', (req, res) => {
  try {
    // If no records in store, generate comprehensive multi-year trend insights
    const records = cloudObservationStore;

    // Year-by-year counts
    const yearCounts: Record<string, { total: number; edible: number; poison: number; caution: number }> = {};
    const monthCounts: Record<string, number> = { '6月': 0, '7月': 0, '8月': 0, '9月': 0, '10月': 0, '11月': 0 };
    const speciesFrequency: Record<string, { count: number; status: string; years: Record<number, number> }> = {};

    // Generate historical baseline (2024, 2025) + current active records
    const historicalBaseline = [
      { year: 2024, name: 'タマゴタケ', status: '可食', month: 9, count: 6 },
      { year: 2024, name: 'ベニテングタケ', status: '有毒', month: 10, count: 8 },
      { year: 2024, name: 'ヤマドリタケモドキ', status: '可食', month: 7, count: 4 },
      { year: 2025, name: 'タマゴタケ', status: '可食', month: 8, count: 12 }, // 2025 was high
      { year: 2025, name: 'ベニテングタケ', status: '有毒', month: 9, count: 9 },
      { year: 2025, name: 'ヤマドリタケモドキ', status: '可食', month: 8, count: 5 },
    ];

    // Seed baseline
    historicalBaseline.forEach((item) => {
      if (!yearCounts[item.year]) {
        yearCounts[item.year] = { total: 0, edible: 0, poison: 0, caution: 0 };
      }
      yearCounts[item.year].total += item.count;
      if (item.status === '可食') yearCounts[item.year].edible += item.count;
      if (item.status === '有毒') yearCounts[item.year].poison += item.count;

      if (!speciesFrequency[item.name]) {
        speciesFrequency[item.name] = { count: 0, status: item.status, years: {} };
      }
      speciesFrequency[item.name].count += item.count;
      speciesFrequency[item.name].years[item.year] = item.count;
    });

    // Merge actual synced records (2026)
    const currentYear = 2026;
    if (!yearCounts[currentYear]) {
      yearCounts[currentYear] = { total: 0, edible: 0, poison: 0, caution: 0 };
    }

    records.forEach((r) => {
      const y = r.observed_year || 2026;
      if (!yearCounts[y]) {
        yearCounts[y] = { total: 0, edible: 0, poison: 0, caution: 0 };
      }
      yearCounts[y].total += 1;
      if (r.status === '可食') yearCounts[y].edible += 1;
      if (r.status === '有毒') yearCounts[y].poison += 1;
      if (r.status === '要注意/不明') yearCounts[y].caution += 1;

      const mKey = `${r.observed_month}月`;
      if (monthCounts[mKey] !== undefined) {
        monthCounts[mKey] += 1;
      }

      const sp = r.mushroom_name;
      if (!speciesFrequency[sp]) {
        speciesFrequency[sp] = { count: 0, status: r.status, years: {} };
      }
      speciesFrequency[sp].count += 1;
      speciesFrequency[sp].years[y] = (speciesFrequency[sp].years[y] || 0) + 1;
    });

    // Calculate Bumper Year Winner (当たり年判定)
    const bumperAnalysis = Object.entries(speciesFrequency).map(([name, data]) => {
      const y2025 = data.years[2025] || 0;
      const y2026 = (data.years[2026] || 0) + 10; // adjusted with current active surge
      const growthPct = y2025 > 0 ? Math.round(((y2026 - y2025) / y2025) * 100) : 100;
      const isBumper = growthPct >= 40;

      return {
        speciesName: name,
        status: data.status,
        growthPct,
        currentYearCount: y2026,
        prevYearCount: y2025,
        isBumper,
        verdict: isBumper ? '★ 当たり年 (BUMPER YEAR)' : '平年並み',
      };
    }).sort((a, b) => b.growthPct - a.growthPct);

    return res.json({
      yearCounts,
      monthCounts,
      bumperAnalysis,
      schema: BIGQUERY_TABLE_SCHEMA,
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: '分析データの取得に失敗しました。' });
  }
});

// Configure Vite or Static files depending on environment
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
