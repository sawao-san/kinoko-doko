"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Pencil,
  RotateCcw,
  Trash2,
  Mic,
  MicOff,
  Sparkles,
  Play,
  Pause,
  Award,
  AlertCircle,
  Download,
  Lightbulb,
  Archive,
  Copy,
  Check,
  Square,
  Circle,
  Diamond,
  GitCommitHorizontal,
  MoveRight,
  Type,
  MousePointer,
  Workflow,
  MapPin,
  Compass,
  Trees,
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  Image as ImageIcon,
  FolderOpen,
  Columns,
  Eye,
  CheckCircle2,
  Search,
} from "lucide-react";

const PRESET_TOPICS = [
  "ベニテングタケの特徴とタマゴタケとの見分け方（毒の有無・ツボとツバ）",
  "ツキヨタケとシイタケの違い（夜間のヒダ発光・縦裂きの黒シミ）",
  "死の天使ドクツルタケの猛毒リスクと純白の特徴",
  "ヤマドリタケモドキ（ポルチーニ）とイグチ科の管孔構造",
  "なぜキノコは雨の後に一斉に生えるのか？",
  "キノコと樹木の地下共生ネットワーク（菌根菌の仕組み）",
  "信州特産キノコの菌床栽培プロセス",
];

const FOLDER_CATEGORIES = [
  "すべて",
  "食用キノコ・名産",
  "毒キノコ・要注意",
  "菌根菌・共生メカニズム",
  "北信・東信エリア",
  "中信・南信エリア",
];

export type ToolType = "select" | "rect" | "rounded" | "diamond" | "ellipse" | "arrow" | "text" | "draw";
export type ShapeKind = "rect" | "rounded" | "diamond" | "ellipse";
export type PortPosition = "top" | "right" | "bottom" | "left";
export type ConnectorStyle = "curved" | "orthogonal" | "straight";
export type MaximizedPane = "none" | "note" | "eval" | "center" | "right";

export interface CanvasElement {
  id: string;
  type: "rect" | "arrow" | "text" | "draw";
  shapeKind?: ShapeKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  endX?: number;
  endY?: number;
  fromId?: string;
  fromPort?: PortPosition;
  toId?: string;
  toPort?: PortPosition;
  connectorStyle?: ConnectorStyle;
  text?: string;
  color: string;
  bgColor?: string;
  points?: { x: number; y: number }[];
}

interface HabitatLocation {
  name: string;
  area: string;
  lat: number;
  lng: number;
  altitude: string;
  treeType: string;
  season?: string;
  description: string;
  probability?: string;
}

interface AgentReview {
  name: string;
  comment: string;
  clarityScore?: number;
  accuracyScore?: number;
}

interface SubEvaluation {
  score: number;
  comment: string;
  goodPoints: string[];
  improvementPoints: string[];
}

interface NaganoHabitatSummary {
  overview: string;
  bestSeason: string;
  preferredEnvironment: string;
  regionalGuide?: {
    hokushin: string;
    toshin: string;
    chushin: string;
    nanshin: string;
  };
}

export interface MushroomSearchImage {
  url: string;
  title: string;
  source: "wikipedia" | "commons";
  caption?: string;
  width?: number;
  height?: number;
}

interface EvaluationResult {
  score: number;
  mushroomName?: string;
  recommendedFolder?: string;
  summary: string;
  nanoBananaImage?: string;
  nanoBananaModel?: string;
  nanoBananaPrompt?: string;
  searchImages?: MushroomSearchImage[];
  wikiUrl?: string;
  wikiExtract?: string;
  drawingEvaluation?: SubEvaluation;
  explanationEvaluation?: SubEvaluation;
  naganoHabitatSummary?: NaganoHabitatSummary;
  agents?: {
    kid: AgentReview;
    expert: AgentReview;
    sensei: { name: string; comment: string };
  };
  habitatLocations?: HabitatLocation[];
  goodPoints: string[];
  redPenAdvice: string[];
  feynmanCheck: {
    simplicity: number;
    structure: number;
    clarity: number;
  };
  mode?: string;
}

interface SavedKnowledge {
  id: string;
  topic: string;
  author: string;
  folder: string;
  score: number;
  date: string;
  imageUrl: string;
  nanoBananaImage?: string;
  transcript: string;
  summary: string;
  habitatCount?: number;
}

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);

  // お題 & 発表者
  const [topic, setTopic] = useState("なぜキノコは雨の後に一斉に生えるのか？");
  const [authorName, setAuthorName] = useState("信州キノコ専門家 (あなた)");

  // NotebookLM風 3ペイン＋下部評価パネルの最大化ステート
  const [maximizedPane, setMaximizedPane] = useState<MaximizedPane>("none");

  // タイマー
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // キャンバス・ツール状態
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const labelInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>("select");
  const [currentColor, setCurrentColor] = useState("#2563eb");
  const [connectorStyle, setConnectorStyle] = useState<ConnectorStyle>("curved");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // 図形・要素リスト
  const [elements, setElements] = useState<CanvasElement[]>([]);

  // ドラッグ・draw.io風コネクタ接続用ステート
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ elementId: string; port: PortPosition } | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<{
    elementId: string;
    port: PortPosition;
    currentX: number;
    currentY: number;
    snapTarget: { elementId: string; port: PortPosition } | null;
  } | null>(null);
  const [reconnectingArrow, setReconnectingArrow] = useState<{
    arrowId: string;
    end: "from" | "to";
  } | null>(null);
  const [resizingShape, setResizingShape] = useState<{
    elementId: string;
    startX: number;
    startY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editTextValue, setEditTextValue] = useState("");

  // 音声入力・書き起こし
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // AI評価 & Nano Banana生成 & Google Maps連携
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingBanana, setIsGeneratingBanana] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [customBananaImage, setCustomBananaImage] = useState<string | null>(null);
  const [compareSketchMode, setCompareSketchMode] = useState(false);
  const [latestSketchUrl, setLatestSketchUrl] = useState<string>("");

  // 右ペイン：Google Maps 生息地マップ状態
  const [selectedPin, setSelectedPin] = useState<HabitatLocation | null>({
    name: "上田市・真田の赤松林",
    area: "東信",
    lat: 36.42,
    lng: 138.3,
    altitude: "標高 600〜850m",
    treeType: "アカマツ・コナラ混交林",
    season: "9月下旬〜10月中旬",
    description: "信州を代表するキノコの名産地。秋雨の後の地温低下時に一斉発生します。",
    probability: "発生確率: 88% (降雨後3日目)",
  });
  const [mapViewType, setMapViewType] = useState<"google" | "partner" | "regional">("partner");
  const [partnerMapUrl, setPartnerMapUrl] = useState("https://harada-mushroom-map-hlslgpaxaq-an.a.run.app");
  const [selectedSearchImg, setSelectedSearchImg] = useState<string | null>(null);
  const [mushroomSearchQuery, setMushroomSearchQuery] = useState("");
  const [isSearchingMushroom, setIsSearchingMushroom] = useState(false);
  const [searchedImages, setSearchedImages] = useState<MushroomSearchImage[]>([]);
  const [searchedWikiExtract, setSearchedWikiExtract] = useState<string>("");
  const [searchedWikiUrl, setSearchedWikiUrl] = useState<string>("");
  const [searchedMushroomName, setSearchedMushroomName] = useState<string>("");

  // 会社の資産化（フォルダ分け対応） & マップJSONコピー
  const [showGallery, setShowGallery] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>("すべて");
  const [saveFolder, setSaveFolder] = useState<string>("菌根菌・共生メカニズム");
  const [isSaved, setIsSaved] = useState(false);
  const [copiedMapJson, setCopiedMapJson] = useState(false);
  const [knowledgeList, setKnowledgeList] = useState<SavedKnowledge[]>([
    {
      id: "asset-1",
      topic: "キノコと樹木の地下共生ネットワーク",
      author: "信州キノコ研究所・研究員",
      folder: "菌根菌・共生メカニズム",
      score: 94,
      date: "本日 11:20",
      imageUrl: "",
      transcript:
        "菌根菌が土中のリンや水分を集めて樹木に渡し、代わりに光合成で作った糖分をもらう互恵関係の図解です。",
      summary:
        "樹木と地下菌糸ネットワークのやり取りがフローチャートで直感的に整理され、社内教材に認定！",
      habitatCount: 4,
    },
  ]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // タイマー管理
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMaximize = (pane: MaximizedPane) => {
    setMaximizedPane((prev) => (prev === pane ? "none" : pane));
  };

  // =========================================================================
  // draw.io風 図形ポート計算・コネクタルーティング用ヘルパー
  // =========================================================================
  const getShapePortCoords = useCallback(
    (el: CanvasElement, port: PortPosition): { x: number; y: number } => {
      const w = el.width || 150;
      const h = el.height || 54;
      switch (port) {
        case "top":
          return { x: el.x + w / 2, y: el.y };
        case "right":
          return { x: el.x + w, y: el.y + h / 2 };
        case "bottom":
          return { x: el.x + w / 2, y: el.y + h };
        case "left":
          return { x: el.x, y: el.y + h / 2 };
      }
    },
    []
  );

  const getPortNormal = (port?: PortPosition): { nx: number; ny: number } => {
    switch (port) {
      case "top":
        return { nx: 0, ny: -1 };
      case "right":
        return { nx: 1, ny: 0 };
      case "bottom":
        return { nx: 0, ny: 1 };
      case "left":
        return { nx: -1, ny: 0 };
      default:
        return { nx: 1, ny: 0 };
    }
  };

  const getBestPortsBetween = useCallback(
    (fromEl: CanvasElement, toEl: CanvasElement): { fromPort: PortPosition; toPort: PortPosition } => {
      const fw = fromEl.width || 150;
      const fh = fromEl.height || 54;
      const tw = toEl.width || 150;
      const th = toEl.height || 54;
      const fcx = fromEl.x + fw / 2;
      const fcy = fromEl.y + fh / 2;
      const tcx = toEl.x + tw / 2;
      const tcy = toEl.y + th / 2;
      const dx = tcx - fcx;
      const dy = tcy - fcy;

      if (Math.abs(dx) >= Math.abs(dy) * 0.85) {
        return dx >= 0
          ? { fromPort: "right", toPort: "left" }
          : { fromPort: "left", toPort: "right" };
      } else {
        return dy >= 0
          ? { fromPort: "bottom", toPort: "top" }
          : { fromPort: "top", toPort: "bottom" };
      }
    },
    []
  );

  const getArrowEndpoints = useCallback(
    (
      arrow: CanvasElement,
      allElements: CanvasElement[]
    ): {
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      fromPort?: PortPosition;
      toPort?: PortPosition;
    } => {
      const fromEl = arrow.fromId ? allElements.find((e) => e.id === arrow.fromId) : undefined;
      const toEl = arrow.toId ? allElements.find((e) => e.id === arrow.toId) : undefined;

      let fromPort = arrow.fromPort;
      let toPort = arrow.toPort;
      if (fromEl && toEl && (!fromPort || !toPort)) {
        const auto = getBestPortsBetween(fromEl, toEl);
        fromPort = fromPort || auto.fromPort;
        toPort = toPort || auto.toPort;
      }

      let fromX = arrow.x;
      let fromY = arrow.y;
      if (fromEl) {
        const p = getShapePortCoords(fromEl, fromPort || "right");
        fromX = p.x;
        fromY = p.y;
      }

      let toX = arrow.endX ?? arrow.x + 90;
      let toY = arrow.endY ?? arrow.y;
      if (toEl) {
        const p = getShapePortCoords(toEl, toPort || "left");
        toX = p.x;
        toY = p.y;
      }

      return { fromX, fromY, toX, toY, fromPort, toPort };
    },
    [getBestPortsBetween, getShapePortCoords]
  );

  // 指定座標の近くにある図形ポートまたは図形本体を検索（スナップ接続用）
  const findPortAtPoint = useCallback(
    (
      x: number,
      y: number,
      excludeId?: string,
      snapRadius = 15
    ): { elementId: string; port: PortPosition } | null => {
      const ports: PortPosition[] = ["top", "right", "bottom", "left"];
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type !== "rect" || el.id === excludeId) continue;
        for (const port of ports) {
          const pt = getShapePortCoords(el, port);
          if (Math.hypot(x - pt.x, y - pt.y) <= snapRadius) {
            return { elementId: el.id, port };
          }
        }
      }
      return null;
    },
    [elements, getShapePortCoords]
  );

  const findSnapTargetForConnection = useCallback(
    (
      x: number,
      y: number,
      fromElementId: string,
      fromPort: PortPosition
    ): { elementId: string; port: PortPosition } | null => {
      // 1. まずポート直接ヒットを確認
      const directPort = findPortAtPoint(x, y, fromElementId, 20);
      if (directPort) return directPort;

      // 2. 図形内部または外周付近に入った場合、最も近いポートに自動スナップ
      const ports: PortPosition[] = ["top", "right", "bottom", "left"];
      for (let i = elements.length - 1; i >= 0; i--) {
        const el = elements[i];
        if (el.type !== "rect" || el.id === fromElementId) continue;
        const w = el.width || 150;
        const h = el.height || 54;
        if (x >= el.x - 14 && x <= el.x + w + 14 && y >= el.y - 14 && y <= el.y + h + 14) {
          let bestPort: PortPosition = "left";
          let minDist = Infinity;
          for (const p of ports) {
            const pt = getShapePortCoords(el, p);
            const d = Math.hypot(x - pt.x, y - pt.y);
            if (d < minDist) {
              minDist = d;
              bestPort = p;
            }
          }
          return { elementId: el.id, port: bestPort };
        }
      }
      return null;
    },
    [elements, findPortAtPoint, getShapePortCoords]
  );

  // キャンバスの再描画
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // draw.io風 ドット＆グリッド背景
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // 初期案内
    if (elements.length === 0) {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 12px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "✨ 上の図形をドラッグ＆ドロップ配置！図形の青い点(●)からドラッグしてdraw.io風に矢印で繋げます",
        canvas.width / 2,
        canvas.height / 2 - 10
      );
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(
        "（「🍄キノコ絵サンプル」や「生態フロー」ボタンで一発配置もできます）",
        canvas.width / 2,
        canvas.height / 2 + 12
      );
    }

    // コネクタ描画関数（曲線 / 折れ線 / 直線 対応）
    const drawConnectorLine = (
      fromX: number,
      fromY: number,
      toX: number,
      toY: number,
      fromPort: PortPosition | undefined,
      toPort: PortPosition | undefined,
      style: ConnectorStyle,
      strokeColor: string,
      isSelected: boolean,
      isPreview = false,
      label?: string
    ) => {
      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : 2.5;
      if (isPreview) {
        ctx.setLineDash([6, 4]);
      }

      let endAngle = Math.atan2(toY - fromY, toX - fromX);
      let midX = (fromX + toX) / 2;
      let midY = (fromY + toY) / 2;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);

      if (style === "curved" && (fromPort || toPort)) {
        const dist = Math.max(45, Math.hypot(toX - fromX, toY - fromY) * 0.42);
        const fn = getPortNormal(fromPort);
        const tn = toPort
          ? getPortNormal(toPort)
          : { nx: -Math.cos(endAngle), ny: -Math.sin(endAngle) };
        const cp1x = fromX + fn.nx * dist;
        const cp1y = fromY + fn.ny * dist;
        const cp2x = toX + tn.nx * dist;
        const cp2y = toY + tn.ny * dist;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, toX, toY);

        // ベジェ曲線の中点(t=0.5)と終端接線角度
        midX = 0.125 * fromX + 0.375 * cp1x + 0.375 * cp2x + 0.125 * toX;
        midY = 0.125 * fromY + 0.375 * cp1y + 0.375 * cp2y + 0.125 * toY;
        if (toPort) {
          endAngle = Math.atan2(-tn.ny, -tn.nx);
        } else {
          endAngle = Math.atan2(toY - cp2y, toX - cp2x);
        }
      } else if (style === "orthogonal") {
        const isHorizontal = !fromPort || fromPort === "left" || fromPort === "right";
        if (isHorizontal) {
          const mx = (fromX + toX) / 2;
          ctx.lineTo(mx, fromY);
          ctx.lineTo(mx, toY);
          ctx.lineTo(toX, toY);
          midX = mx;
          midY = (fromY + toY) / 2;
          endAngle = toX >= mx ? 0 : Math.PI;
        } else {
          const my = (fromY + toY) / 2;
          ctx.lineTo(fromX, my);
          ctx.lineTo(toX, my);
          ctx.lineTo(toX, toY);
          midX = (fromX + toX) / 2;
          midY = my;
          endAngle = toY >= my ? Math.PI / 2 : -Math.PI / 2;
        }
      } else {
        ctx.lineTo(toX, toY);
      }

      ctx.stroke();
      ctx.setLineDash([]);

      // 矢印ヘッド
      const headLength = 11;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - headLength * Math.cos(endAngle - Math.PI / 6),
        toY - headLength * Math.sin(endAngle - Math.PI / 6)
      );
      ctx.lineTo(
        toX - headLength * Math.cos(endAngle + Math.PI / 6),
        toY - headLength * Math.sin(endAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();

      // ラベルピル描画
      if (label) {
        ctx.font = "bold 11px -apple-system, sans-serif";
        const textWidth = ctx.measureText(label).width;
        const padX = 6;
        const pillW = textWidth + padX * 2;
        const pillH = 18;
        ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(midX - pillW / 2, midY - pillH / 2, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, midX, midY);
      }
      ctx.restore();
    };

    // 1. まず矢印（コネクタ）を背面に描画
    elements.forEach((elem) => {
      if (elem.type !== "arrow") return;
      const isSelected = elem.id === selectedElementId;
      const { fromX, fromY, toX, toY, fromPort, toPort } = getArrowEndpoints(elem, elements);
      const strokeColor = isSelected ? "#4f46e5" : elem.color;

      drawConnectorLine(
        fromX,
        fromY,
        toX,
        toY,
        fromPort,
        toPort,
        elem.connectorStyle || connectorStyle,
        strokeColor,
        isSelected,
        false,
        elem.text
      );

      // 選択中の矢印には両端の再接続ハンドルを表示
      if (isSelected) {
        [
          { x: fromX, y: fromY },
          { x: toX, y: toY },
        ].forEach((pt) => {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
      }
    });

    // 2. 図形・テキスト・フリーハンド描画
    elements.forEach((elem) => {
      if (elem.type === "arrow") return;
      const isSelected = elem.id === selectedElementId;
      const isHovered = elem.id === hoveredElementId;

      if (elem.type === "rect") {
        const w = elem.width || 150;
        const h = elem.height || 54;
        const kind: ShapeKind = elem.shapeKind || "rect";

        const traceShapePath = (ox: number, oy: number) => {
          ctx.beginPath();
          if (kind === "rounded") {
            ctx.roundRect(ox, oy, w, h, Math.min(w, h) / 2);
          } else if (kind === "ellipse") {
            ctx.ellipse(ox + w / 2, oy + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
          } else if (kind === "diamond") {
            ctx.moveTo(ox + w / 2, oy);
            ctx.lineTo(ox + w, oy + h / 2);
            ctx.lineTo(ox + w / 2, oy + h);
            ctx.lineTo(ox, oy + h / 2);
            ctx.closePath();
          } else {
            ctx.roundRect(ox, oy, w, h, 10);
          }
        };

        // ドロップシャドウ
        ctx.fillStyle = isSelected ? "rgba(79, 70, 229, 0.10)" : "rgba(0,0,0,0.05)";
        traceShapePath(elem.x + 2, elem.y + 3);
        ctx.fill();

        // 本体塗り＆枠線
        ctx.fillStyle = elem.bgColor || "#eff6ff";
        ctx.strokeStyle = isSelected ? "#4f46e5" : elem.color;
        ctx.lineWidth = isSelected ? 3 : 2;
        traceShapePath(elem.x, elem.y);
        ctx.fill();
        ctx.stroke();

        // テキスト
        if (elem.text) {
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 12px -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(elem.text, elem.x + w / 2, elem.y + h / 2);
        }

        // 選択時の右下リサイズハンドル
        if (isSelected) {
          ctx.fillStyle = "#4f46e5";
          ctx.fillRect(elem.x + w - 5, elem.y + h - 5, 8, 8);
        }

        // draw.io風 4方向コネクションポート（ホバー時・選択時・コネクタドラッグ中）
        if (isSelected || isHovered || connectingFrom !== null || activeTool === "arrow") {
          const ports: PortPosition[] = ["top", "right", "bottom", "left"];
          ports.forEach((port) => {
            const pt = getShapePortCoords(elem, port);
            const isPortHovered =
              (hoveredPort?.elementId === elem.id && hoveredPort?.port === port) ||
              (connectingFrom?.snapTarget?.elementId === elem.id &&
                connectingFrom?.snapTarget?.port === port);

            ctx.save();
            if (isPortHovered) {
              // スナップハイライトリング
              ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
              ctx.beginPath();
              ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.fillStyle = isPortHovered ? "#10b981" : "#ffffff";
            ctx.strokeStyle = isPortHovered ? "#059669" : "#2563eb";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, isPortHovered ? 6 : 4.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
          });
        }
      } else if (elem.type === "text") {
        ctx.fillStyle = elem.color;
        ctx.font = "600 13px -apple-system, sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(elem.text || "テキスト", elem.x, elem.y);

        if (isSelected) {
          ctx.strokeStyle = "#4f46e5";
          ctx.lineWidth = 1;
          ctx.setLineDash([3, 3]);
          const metrics = ctx.measureText(elem.text || "テキスト");
          ctx.strokeRect(elem.x - 4, elem.y - 2, metrics.width + 8, 22);
          ctx.setLineDash([]);
        }
      } else if (elem.type === "draw" && elem.points && elem.points.length > 1) {
        ctx.strokeStyle = isSelected ? "#4f46e5" : elem.color;
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(elem.points[0].x, elem.points[0].y);
        for (let i = 1; i < elem.points.length; i++) {
          ctx.lineTo(elem.points[i].x, elem.points[i].y);
        }
        ctx.stroke();
      }
    });

    // 3. ポートからドラッグ中のリアルタイム接続プレビュー線
    if (connectingFrom) {
      const sourceEl = elements.find((e) => e.id === connectingFrom.elementId);
      if (sourceEl) {
        const startPt = getShapePortCoords(sourceEl, connectingFrom.port);
        let endX = connectingFrom.currentX;
        let endY = connectingFrom.currentY;
        let targetPort: PortPosition | undefined = undefined;

        if (connectingFrom.snapTarget) {
          const targetEl = elements.find((e) => e.id === connectingFrom.snapTarget?.elementId);
          if (targetEl) {
            const snapPt = getShapePortCoords(targetEl, connectingFrom.snapTarget.port);
            endX = snapPt.x;
            endY = snapPt.y;
            targetPort = connectingFrom.snapTarget.port;
          }
        }

        drawConnectorLine(
          startPt.x,
          startPt.y,
          endX,
          endY,
          connectingFrom.port,
          targetPort,
          connectorStyle,
          connectingFrom.snapTarget ? "#10b981" : "#2563eb",
          true,
          true,
          connectingFrom.snapTarget ? "接続!" : "ここで離すと新規ノード作成"
        );
      }
    }
  }, [
    elements,
    selectedElementId,
    hoveredElementId,
    hoveredPort,
    connectingFrom,
    connectorStyle,
    activeTool,
    getArrowEndpoints,
    getShapePortCoords,
  ]);

  // コンテナのリサイズや最大化切替時にキャンバスサイズを自動同期
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = Math.floor(rect.width);
        canvas.height = Math.floor(rect.height);
        renderCanvas();
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [renderCanvas, maximizedPane]);

  useEffect(() => {
    renderCanvas();
  }, [elements, selectedElementId, renderCanvas]);

  // 新規図形ノード作成ヘルパー
  const createShapeNode = (
    kind: ShapeKind,
    centerX: number,
    centerY: number,
    customText?: string
  ): CanvasElement => {
    const isDiamond = kind === "diamond";
    const w = isDiamond ? 140 : 148;
    const h = isDiamond ? 66 : 52;
    const defaultLabels: Record<ShapeKind, string> = {
      rect: "菌糸の成長",
      rounded: "秋雨・水分吸収",
      diamond: "地温15℃以下？",
      ellipse: "子実体(キノコ)発生",
    };
    return {
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "rect",
      shapeKind: kind,
      x: Math.max(8, centerX - w / 2),
      y: Math.max(8, centerY - h / 2),
      width: w,
      height: h,
      text: customText ?? defaultLabels[kind],
      color: currentColor,
      bgColor: `${currentColor}18`,
    };
  };

  // パレットからのHTML5ドラッグ＆ドロップ配置ハンドラ
  const handlePaletteDragStart = (e: React.DragEvent, kind: ShapeKind) => {
    e.dataTransfer.setData("application/x-nagano-shape", kind);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const kind = (e.dataTransfer.getData("application/x-nagano-shape") || "rect") as ShapeKind;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode = createShapeNode(kind, x, y);

    // もし選択中の図形があれば、自動的にdraw.io風コネクタで繋ぐか判定（近くにドロップした場合）
    const selectedShape = elements.find((el) => el.id === selectedElementId && el.type === "rect");
    if (selectedShape) {
      const ports = getBestPortsBetween(selectedShape, newNode);
      const autoArrow: CanvasElement = {
        id: `arrow-${Date.now()}`,
        type: "arrow",
        x: selectedShape.x,
        y: selectedShape.y,
        fromId: selectedShape.id,
        fromPort: ports.fromPort,
        toId: newNode.id,
        toPort: ports.toPort,
        connectorStyle,
        text: "",
        color: currentColor,
      };
      setElements((prev) => [...prev, newNode, autoArrow]);
    } else {
      setElements((prev) => [...prev, newNode]);
    }
    setSelectedElementId(newNode.id);
    setActiveTool("select");
  };

  // ダブルクリックで即座にラベル入力にフォーカス
  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 空きスペースをダブルクリックしたら新規ボックスを作成
    const hit = [...elements].reverse().find((el) => {
      if (el.type === "rect") {
        const w = el.width || 150;
        const h = el.height || 54;
        return x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h;
      }
      return false;
    });

    if (hit) {
      setSelectedElementId(hit.id);
      setEditingTextId(hit.id);
      setEditTextValue(hit.text || "");
      setTimeout(() => labelInputRef.current?.focus(), 30);
    } else {
      const newNode = createShapeNode("rect", x, y, "新しい項目");
      setElements((prev) => [...prev, newNode]);
      setSelectedElementId(newNode.id);
      setEditingTextId(newNode.id);
      setEditTextValue(newNode.text || "");
      setActiveTool("select");
      setTimeout(() => labelInputRef.current?.focus(), 30);
    }
  };

  // クリック・ドラッグイベント
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. まず図形の4方向コネクションポート(●)をクリックしたか最優先チェック（どのツールでも即座に矢印接続開始！）
    if (activeTool !== "draw") {
      const hitPort = findPortAtPoint(x, y, undefined, 14);
      if (hitPort) {
        const pt = getShapePortCoords(
          elements.find((el) => el.id === hitPort.elementId)!,
          hitPort.port
        );
        setConnectingFrom({
          elementId: hitPort.elementId,
          port: hitPort.port,
          currentX: pt.x,
          currentY: pt.y,
          snapTarget: null,
        });
        setSelectedElementId(hitPort.elementId);
        setIsInteracting(true);
        return;
      }
    }

    // 2. 選択中の図形の右下リサイズハンドルをチェック
    if (selectedElementId) {
      const selEl = elements.find((el) => el.id === selectedElementId);
      if (selEl && selEl.type === "rect") {
        const w = selEl.width || 150;
        const h = selEl.height || 54;
        if (Math.abs(x - (selEl.x + w)) <= 10 && Math.abs(y - (selEl.y + h)) <= 10) {
          setResizingShape({
            elementId: selEl.id,
            startX: x,
            startY: y,
            origW: w,
            origH: h,
          });
          setIsInteracting(true);
          return;
        }
      }

      // 選択中の矢印の端点ハンドル（再接続用）をチェック
      if (selEl && selEl.type === "arrow") {
        const { fromX, fromY, toX, toY } = getArrowEndpoints(selEl, elements);
        if (Math.hypot(x - toX, y - toY) <= 12) {
          setReconnectingArrow({ arrowId: selEl.id, end: "to" });
          setIsInteracting(true);
          return;
        }
        if (Math.hypot(x - fromX, y - fromY) <= 12) {
          setReconnectingArrow({ arrowId: selEl.id, end: "from" });
          setIsInteracting(true);
          return;
        }
      }
    }

    if (activeTool === "select") {
      const found = [...elements].reverse().find((el) => {
        if (el.type === "rect") {
          const w = el.width || 150;
          const h = el.height || 54;
          return x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h;
        } else if (el.type === "text") {
          return x >= el.x && x <= el.x + 180 && y >= el.y && y <= el.y + 28;
        } else if (el.type === "arrow") {
          const { fromX, fromY, toX, toY } = getArrowEndpoints(el, elements);
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          return (
            Math.hypot(x - midX, y - midY) < 32 ||
            Math.hypot(x - fromX, y - fromY) < 16 ||
            Math.hypot(x - toX, y - toY) < 16
          );
        } else if (el.type === "draw" && el.points) {
          return el.points.some((pt) => Math.hypot(x - pt.x, y - pt.y) < 12);
        }
        return false;
      });

      setSelectedElementId(found ? found.id : null);
      if (found) {
        setIsInteracting(true);
        setDragStart({ x, y });
      }
    } else if (
      activeTool === "rect" ||
      activeTool === "rounded" ||
      activeTool === "diamond" ||
      activeTool === "ellipse"
    ) {
      const newElem = createShapeNode(activeTool, x, y);
      setElements([...elements, newElem]);
      setSelectedElementId(newElem.id);
      setActiveTool("select");
    } else if (activeTool === "text") {
      const newElem: CanvasElement = {
        id: `elem-${Date.now()}`,
        type: "text",
        x,
        y,
        text: "秋雨と地温低下がトリガー",
        color: currentColor,
      };
      setElements([...elements, newElem]);
      setSelectedElementId(newElem.id);
      setActiveTool("select");
    } else if (activeTool === "arrow") {
      // 矢印ツールで図形の上からドラッグ開始した場合は、その図形からコネクタ接続を開始！
      const hitShape = [...elements]
        .reverse()
        .find(
          (el) =>
            el.type === "rect" &&
            x >= el.x &&
            x <= el.x + (el.width || 150) &&
            y >= el.y &&
            y <= el.y + (el.height || 54)
        );
      if (hitShape) {
        setConnectingFrom({
          elementId: hitShape.id,
          port: "right",
          currentX: x,
          currentY: y,
          snapTarget: null,
        });
        setIsInteracting(true);
        return;
      }

      const newElem: CanvasElement = {
        id: `elem-${Date.now()}`,
        type: "arrow",
        x,
        y,
        endX: x + 90,
        endY: y,
        connectorStyle,
        text: "水分吸収",
        color: currentColor,
      };
      setElements([...elements, newElem]);
      setSelectedElementId(newElem.id);
      setActiveTool("select");
    } else if (activeTool === "draw") {
      const newDraw: CanvasElement = {
        id: `elem-${Date.now()}`,
        type: "draw",
        x,
        y,
        color: currentColor,
        points: [{ x, y }],
      };
      setElements([...elements, newDraw]);
      setSelectedElementId(newDraw.id);
      setIsInteracting(true);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. コネクタポートからドラッグ中（新規矢印接続）
    if (connectingFrom) {
      const snapTarget = findSnapTargetForConnection(
        x,
        y,
        connectingFrom.elementId,
        connectingFrom.port
      );
      setConnectingFrom((prev) =>
        prev ? { ...prev, currentX: x, currentY: y, snapTarget } : null
      );
      return;
    }

    // 2. 既存矢印の端点をドラッグして再接続中
    if (reconnectingArrow) {
      const snap = findPortAtPoint(x, y, undefined, 22);
      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== reconnectingArrow.arrowId) return el;
          if (reconnectingArrow.end === "to") {
            return snap
              ? { ...el, toId: snap.elementId, toPort: snap.port, endX: x, endY: y }
              : { ...el, toId: undefined, toPort: undefined, endX: x, endY: y };
          } else {
            return snap
              ? { ...el, fromId: snap.elementId, fromPort: snap.port, x, y }
              : { ...el, fromId: undefined, fromPort: undefined, x, y };
          }
        })
      );
      return;
    }

    // 3. 図形のリサイズ中
    if (resizingShape) {
      const newW = Math.max(80, resizingShape.origW + (x - resizingShape.startX));
      const newH = Math.max(38, resizingShape.origH + (y - resizingShape.startY));
      setElements((prev) =>
        prev.map((el) =>
          el.id === resizingShape.elementId ? { ...el, width: newW, height: newH } : el
        )
      );
      return;
    }

    // 4. 非ドラッグ時はホバー中の図形とポートを検出してハイライト表示
    if (!isInteracting) {
      const portHit = findPortAtPoint(x, y, undefined, 14);
      setHoveredPort(portHit);

      const shapeHit = [...elements]
        .reverse()
        .find(
          (el) =>
            el.type === "rect" &&
            x >= el.x - 10 &&
            x <= el.x + (el.width || 150) + 10 &&
            y >= el.y - 10 &&
            y <= el.y + (el.height || 54) + 10
        );
      setHoveredElementId(portHit ? portHit.elementId : shapeHit ? shapeHit.id : null);
      return;
    }

    // 5. 選択要素の移動（繋がっている矢印はgetArrowEndpointsにより自動追従！）
    if (activeTool === "select" && selectedElementId && dragStart) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === selectedElementId) {
            return {
              ...el,
              x: el.x + dx,
              y: el.y + dy,
              endX: el.endX !== undefined ? el.endX + dx : undefined,
              endY: el.endY !== undefined ? el.endY + dy : undefined,
              points: el.points
                ? el.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }))
                : undefined,
            };
          }
          return el;
        })
      );
      setDragStart({ x, y });
    } else if (activeTool === "draw" && selectedElementId) {
      setElements((prev) =>
        prev.map((el) => {
          if (el.id === selectedElementId && el.points) {
            return {
              ...el,
              points: [...el.points, { x, y }],
            };
          }
          return el;
        })
      );
    }
  };

  const handleCanvasMouseUp = () => {
    if (connectingFrom) {
      const sourceEl = elements.find((e) => e.id === connectingFrom.elementId);
      if (sourceEl) {
        const startPt = getShapePortCoords(sourceEl, connectingFrom.port);
        const dragDist = Math.hypot(
          connectingFrom.currentX - startPt.x,
          connectingFrom.currentY - startPt.y
        );

        if (connectingFrom.snapTarget) {
          // ターゲット図形のポートへ接続完了！
          const newArrow: CanvasElement = {
            id: `arrow-${Date.now()}`,
            type: "arrow",
            x: startPt.x,
            y: startPt.y,
            endX: connectingFrom.currentX,
            endY: connectingFrom.currentY,
            fromId: connectingFrom.elementId,
            fromPort: connectingFrom.port,
            toId: connectingFrom.snapTarget.elementId,
            toPort: connectingFrom.snapTarget.port,
            connectorStyle,
            text: "",
            color: currentColor,
          };
          setElements((prev) => [...prev, newArrow]);
          setSelectedElementId(newArrow.id);
        } else if (dragDist > 42) {
          // draw.io風クイック生成：空きスペースでドロップしたら自動的に新しい図形を作って矢印で繋ぐ！
          const newNode = createShapeNode(
            "rect",
            connectingFrom.currentX,
            connectingFrom.currentY,
            "次のステップ"
          );
          const oppositePortMap: Record<PortPosition, PortPosition> = {
            right: "left",
            left: "right",
            bottom: "top",
            top: "bottom",
          };
          const targetPort = oppositePortMap[connectingFrom.port];
          const newArrow: CanvasElement = {
            id: `arrow-${Date.now()}`,
            type: "arrow",
            x: startPt.x,
            y: startPt.y,
            endX: connectingFrom.currentX,
            endY: connectingFrom.currentY,
            fromId: connectingFrom.elementId,
            fromPort: connectingFrom.port,
            toId: newNode.id,
            toPort: targetPort,
            connectorStyle,
            text: "",
            color: currentColor,
          };
          setElements((prev) => [...prev, newNode, newArrow]);
          setSelectedElementId(newNode.id);
          setActiveTool("select");
        }
      }
      setConnectingFrom(null);
    }

    setReconnectingArrow(null);
    setResizingShape(null);
    setIsInteracting(false);
    setDragStart(null);
  };

  // ワンクリック・キノコ手書きスケッチ＆解説テンプレート配置
  const handleAddMushroomSketch = () => {
    const cx = 190;
    const cy = 115;
    // カサのドーム曲線
    const capPoints: { x: number; y: number }[] = [];
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.12) {
      capPoints.push({
        x: cx + Math.cos(a) * 85,
        y: cy + Math.sin(a) * 55,
      });
    }
    capPoints.push({ x: cx - 85, y: cy });

    // 柄の曲線
    const stemPoints: { x: number; y: number }[] = [
      { x: cx - 22, y: cy },
      { x: cx - 26, y: cy + 75 },
      { x: cx + 26, y: cy + 75 },
      { x: cx + 22, y: cy },
    ];

    // 地下の菌糸
    const mycelium1: { x: number; y: number }[] = [
      { x: cx, y: cy + 75 },
      { x: cx - 50, y: cy + 100 },
      { x: cx - 110, y: cy + 115 },
    ];
    const mycelium2: { x: number; y: number }[] = [
      { x: cx, y: cy + 75 },
      { x: cx + 55, y: cy + 102 },
      { x: cx + 115, y: cy + 118 },
    ];

    const sketchElements: CanvasElement[] = [
      {
        id: `cap-${Date.now()}`,
        type: "draw",
        x: cx,
        y: cy,
        color: "#b45309",
        points: capPoints,
      },
      {
        id: `stem-${Date.now()}`,
        type: "draw",
        x: cx,
        y: cy,
        color: "#78350f",
        points: stemPoints,
      },
      {
        id: `myc1-${Date.now()}`,
        type: "draw",
        x: cx,
        y: cy + 75,
        color: "#2563eb",
        points: mycelium1,
      },
      {
        id: `myc2-${Date.now()}`,
        type: "draw",
        x: cx,
        y: cy + 75,
        color: "#2563eb",
        points: mycelium2,
      },
      {
        id: `lbl1-${Date.now()}`,
        type: "text",
        x: cx + 92,
        y: cy - 35,
        text: "← 茶色のカサ（芳香・秋雨後に開く）",
        color: "#b45309",
      },
      {
        id: `lbl2-${Date.now()}`,
        type: "text",
        x: cx + 45,
        y: cy + 35,
        text: "← アカマツの根と共生する菌根菌",
        color: "#059669",
      },
      {
        id: `lbl3-${Date.now()}`,
        type: "text",
        x: cx - 120,
        y: cy + 122,
        text: "地下の菌糸ネットワーク（水分を一気に吸収）",
        color: "#2563eb",
      },
    ];

    setElements(sketchElements);
    setSelectedElementId(null);
    if (!transcript) {
      setTranscript(
        "アカマツの根元で共生するキノコです。普段は地下に菌糸を張り巡らせており、秋雨が降って地温が下がると一気に水分を吸って地上に実物を発生させます。"
      );
    }
  };

  // ワンクリック・draw.io風リンク済みフロー図配置（図形を動かすと矢印も自動追従！）
  const handleAddFlowchartTemplate = () => {
    const ts = Date.now();
    const id1 = `box-1-${ts}`;
    const id2 = `box-2-${ts}`;
    const id3 = `box-3-${ts}`;
    const id4 = `box-4-${ts}`;

    const template: CanvasElement[] = [
      {
        id: id1,
        type: "rect",
        shapeKind: "rect",
        x: 18,
        y: 32,
        width: 140,
        height: 48,
        text: "① 地下の菌糸網",
        color: "#2563eb",
        bgColor: "#eff6ff",
      },
      {
        id: id2,
        type: "rect",
        shapeKind: "rounded",
        x: 215,
        y: 32,
        width: 145,
        height: 48,
        text: "② 秋雨・水分吸収",
        color: "#7c3aed",
        bgColor: "#f5f3ff",
      },
      {
        id: id3,
        type: "rect",
        shapeKind: "diamond",
        x: 215,
        y: 122,
        width: 145,
        height: 62,
        text: "③ 地温15℃以下？",
        color: "#d97706",
        bgColor: "#fffbeb",
      },
      {
        id: id4,
        type: "rect",
        shapeKind: "ellipse",
        x: 18,
        y: 128,
        width: 150,
        height: 52,
        text: "④ 子実体一斉発生！",
        color: "#059669",
        bgColor: "#ecfdf5",
      },
      {
        id: `arrow-1-${ts}`,
        type: "arrow",
        x: 158,
        y: 56,
        endX: 215,
        endY: 56,
        fromId: id1,
        fromPort: "right",
        toId: id2,
        toPort: "left",
        connectorStyle,
        text: "降雨",
        color: "#2563eb",
      },
      {
        id: `arrow-2-${ts}`,
        type: "arrow",
        x: 287,
        y: 80,
        endX: 287,
        endY: 122,
        fromId: id2,
        fromPort: "bottom",
        toId: id3,
        toPort: "top",
        connectorStyle,
        text: "冷気",
        color: "#7c3aed",
      },
      {
        id: `arrow-3-${ts}`,
        type: "arrow",
        x: 215,
        y: 153,
        endX: 168,
        endY: 153,
        fromId: id3,
        fromPort: "left",
        toId: id4,
        toPort: "right",
        connectorStyle,
        text: "YES (刺激)",
        color: "#059669",
      },
    ];
    setElements(template);
    setSelectedElementId(null);
    setActiveTool("select");
  };

  // 音声入力
  const toggleRecording = () => {
    if (typeof window === "undefined") return;
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("お使いのブラウザは音声認識に対応していません。Google Chromeをお使いください。");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "ja-JP";
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  // 一括実行：AI評価（左下） ＋ Nano Banana 実物キノコ生成（中央） ＋ Google Map 生息地特定（右）
  const handleEvaluate = async () => {
    const canvas = canvasRef.current;
    setIsEvaluating(true);
    setIsGeneratingBanana(true);
    setIsSaved(false);
    setCustomBananaImage(null);

    try {
      const imageBase64 = canvas ? canvas.toDataURL("image/png") : null;
      if (imageBase64) setLatestSketchUrl(imageBase64);

      const structureDescription = elements
        .map((el, i) => {
          if (el.type === "rect") return `[図形(${el.shapeKind || "rect"})${i + 1}: "${el.text}"]`;
          if (el.type === "arrow") {
            const fromNode = el.fromId ? elements.find((n) => n.id === el.fromId)?.text : null;
            const toNode = el.toId ? elements.find((n) => n.id === el.toId)?.text : null;
            if (fromNode && toNode) {
              return `[接続: "${fromNode}" ──(${el.text || "→"})──> "${toNode}"]`;
            }
            return `(矢印: "${el.text || "→"}")`;
          }
          if (el.type === "text") return `[補足テキスト: "${el.text}"]`;
          return "";
        })
        .filter(Boolean)
        .join(" ➔ ");

      const effectiveTopic = topic || "信州のキノコ生態図解";
      const combinedTranscript = `
【お題】: ${effectiveTopic}
【専門家の説明】: ${transcript || "（音声なし）"}
【ホワイトボードの図解構造】: ${structureDescription || "（手書きスケッチ中心）"}
      `.trim();

      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: effectiveTopic,
          transcript: combinedTranscript,
          imageBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.details || "評価の取得に失敗しました");
      }

      setResult(data);
      if (data.mushroomName) {
        setSearchedMushroomName(data.mushroomName);
      }
      if (data.searchImages && data.searchImages.length > 0) {
        setSearchedImages(data.searchImages);
        setSelectedSearchImg(data.searchImages[0].url);
        setSearchedWikiExtract(data.wikiExtract || "");
        setSearchedWikiUrl(data.wikiUrl || "");
      }
      if (data.recommendedFolder) {
        setSaveFolder(data.recommendedFolder);
      }
      if (data.habitatLocations && data.habitatLocations.length > 0) {
        setSelectedPin(data.habitatLocations[0]);
      }
    } catch (err: any) {
      console.error("Evaluation error:", err);
      alert(`評価エラー: ${err.message || "通信に失敗しました"}`);
    } finally {
      setIsEvaluating(false);
      setIsSearchingMushroom(false);
    }
  };

  // 中央ペイン：指定したキノコ名で実物写真（Wikipedia / Wikimedia Commons）を検索
  const handleSearchMushroom = async (targetName?: string) => {
    const q = (targetName || mushroomSearchQuery || result?.mushroomName || "ベニテングタケ").trim();
    if (!q) return;

    setIsSearchingMushroom(true);
    setSearchedMushroomName(q);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search_mushroom",
          mushroomName: q,
          topic,
        }),
      });
      const data = await res.json();
      if (data.searchImages && data.searchImages.length > 0) {
        setSearchedImages(data.searchImages);
        setSelectedSearchImg(data.searchImages[0].url);
        setSearchedWikiExtract(data.wikiExtract || "");
        setSearchedWikiUrl(data.wikiUrl || "");
      } else {
        alert(`「${q}」の実物写真が見つかりませんでした。別の名称（例: ベニテングタケ、マツタケ等）をお試しください。`);
      }
    } catch (err) {
      console.error("Mushroom search error:", err);
    } finally {
      setIsSearchingMushroom(false);
    }
  };

  // 中央ペイン単独：描いた絵から実物キノコ写真を検索
  const handleRegenerateNanoBanana = async () => {
    const canvas = canvasRef.current;
    const imageBase64 = canvas ? canvas.toDataURL("image/png") : null;
    if (imageBase64) setLatestSketchUrl(imageBase64);
    await handleSearchMushroom(result?.mushroomName || mushroomSearchQuery || "ベニテングタケ");
  };

  // チームメンバーのキノコマップツール用JSONコピー
  const handleCopyPartnerMapJson = () => {
    const locations = result?.habitatLocations || (selectedPin ? [selectedPin] : []);
    if (locations.length === 0) return;

    const exportPayload = {
      source: "FeynmanBoard-MushroomExpert",
      topic: topic,
      mushroom: result?.mushroomName || "信州キノコ",
      score: result?.score || 90,
      nanoBananaImage: customBananaImage || result?.nanoBananaImage || null,
      spots: locations.map((loc) => ({
        title: loc.name,
        area: loc.area,
        latitude: loc.lat,
        longitude: loc.lng,
        altitude: loc.altitude,
        tree: loc.treeType,
        condition: loc.description,
        probability: loc.probability || "高",
      })),
    };

    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopiedMapJson(true);
    setTimeout(() => setCopiedMapJson(false), 2500);
  };

  // 知識資産として保存
  const handleSaveToAssets = () => {
    if (!result) return;
    const canvas = canvasRef.current;
    const imageUrl = canvas ? canvas.toDataURL("image/png") : "";

    const newAsset: SavedKnowledge = {
      id: `asset-${Date.now()}`,
      topic,
      author: authorName,
      folder: saveFolder,
      score: result.score,
      date: "たった今",
      imageUrl,
      nanoBananaImage: customBananaImage || result.nanoBananaImage,
      transcript: transcript || "（キノコ生態図解）",
      summary: result.summary,
      habitatCount: result.habitatLocations?.length || 0,
    };

    setKnowledgeList([newAsset, ...knowledgeList]);
    setIsSaved(true);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `kinoko-diagram-${topic.slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const currentSearchImages = searchedImages.length > 0 ? searchedImages : result?.searchImages || [];
  const currentWikiExtract = searchedWikiExtract || result?.wikiExtract || "";
  const currentWikiUrl = searchedWikiUrl || result?.wikiUrl || "";
  const currentMushroomTitle = searchedMushroomName || result?.mushroomName || "信州のキノコ";

  const activeBananaImage =
    selectedSearchImg ||
    searchedImages[0]?.url ||
    result?.searchImages?.[0]?.url ||
    customBananaImage ||
    result?.nanoBananaImage ||
    null;
  const activeLocations =
    result?.habitatLocations && result.habitatLocations.length > 0
      ? result.habitatLocations
      : selectedPin
      ? [selectedPin]
      : [];

  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-600">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm font-semibold">
            NotebookLM風 3ペイン統合ワークスペースを読み込み中...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-200/70 text-slate-800">
      {/* トップヘッダー */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-sm">
            <Trees className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                Nagano Mind — 信州キノコ専門家黒板 × 実物キノコ検索 × キノコどこどこ
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                NotebookLM Split UI
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              ①左：キノコ手書きノート解説＆AI採点 ➔ ②中央：書いたキノコの実物写真を検索 ➔ ③右：原田さんのキノコマップ連携
            </p>
          </div>
        </div>

        {/* レイアウト表示モード切り替え & 知識資産 & タイマー */}
        <div className="flex items-center gap-2.5">
          {maximizedPane !== "none" && (
            <button
              onClick={() => setMaximizedPane("none")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all animate-pulse"
            >
              <Columns className="w-3.5 h-3.5" />
              3画面スプリットに戻す
            </button>
          )}

          <button
            onClick={() => setShowGallery(!showGallery)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
              showGallery
                ? "bg-emerald-700 text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
            キノコ図鑑フォルダ ({knowledgeList.length})
          </button>

          {/* 3分タイマー */}
          <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <div className="text-center">
              <span className="text-[9px] font-semibold text-slate-400 block uppercase">
                解説タイマー
              </span>
              <span
                className={`font-mono text-base font-bold leading-none ${
                  timeLeft <= 30 ? "text-red-500 animate-pulse" : "text-slate-800"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={`p-1.5 rounded-lg text-white transition-all ${
                isTimerRunning
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              title={isTimerRunning ? "一時停止" : "スタート"}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimeLeft(180);
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200"
              title="リセット"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* 知識資産フォルダギャラリー（モーダル） */}
      {showGallery && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  信州キノコ知的資産フォルダ（Nano Banana 実物図鑑 ＆ 生息地アーカイブ）
                </h3>
              </div>
              <button
                onClick={() => setShowGallery(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-2 py-1"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
              {FOLDER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedFolder(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    selectedFolder === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                  }`}
                >
                  📁 {cat}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
              {knowledgeList
                .filter((item) => selectedFolder === "すべて" || item.folder === selectedFolder)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            📁 {item.folder}
                          </span>
                          <h4 className="font-bold text-sm text-slate-800 mt-1">{item.topic}</h4>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-600 text-white font-bold text-xs rounded-full shrink-0">
                          {item.score}点
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>👤 {item.author}</span>
                        <span>•</span>
                        <span>📍 Google Map ピン: {item.habitatCount}箇所</span>
                      </div>
                      {item.nanoBananaImage && (
                        <div className="mt-2 h-28 rounded-lg overflow-hidden bg-slate-900">
                          <img
                            src={item.nanoBananaImage}
                            alt={item.topic}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg line-clamp-2">
                        💬 {item.summary}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          NotebookLM風 3ペイン・スプリットワークスペース
          - 左ペイン: 上部＝ノート＆解説キャンバス / 一番下＝説明の評価ドック
          - 中央ペイン: 描いた絵を Nano Banana で実物キノコ生成
          - 右ペイン: Google Maps でキノコがどこにあるか表示（チームメンバー統合）
         ===================================================================== */}
      <div className="flex-1 flex overflow-hidden p-2.5 gap-2.5">
        {/* -----------------------------------------------------------------
            【一番左】ノート＆解説（上部） ＋ 説明の評価（一番下）
           ----------------------------------------------------------------- */}
        {(maximizedPane === "none" ||
          maximizedPane === "note" ||
          maximizedPane === "eval") && (
          <div
            className={`flex flex-col gap-2.5 overflow-hidden transition-all duration-200 ${
              maximizedPane === "note" || maximizedPane === "eval"
                ? "w-full flex-1"
                : "w-[36%] min-w-[340px]"
            }`}
          >
            {/* 左ペイン上部：ノート＆解説キャンバス */}
            {maximizedPane !== "eval" && (
              <div
                className={`flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden ${
                  maximizedPane === "note" ? "flex-1" : "h-[60%]"
                }`}
              >
                {/* パネルヘッダー */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <div>
                      <h2 className="text-xs font-extrabold text-slate-900 leading-none">
                        ノート ＆ キノコ解説スケッチ
                      </h2>
                      <span className="text-[10px] text-slate-500">
                        絵を描いて声や文字でキノコを説明
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleEvaluate}
                      disabled={isEvaluating}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold text-white transition-all shadow-xs shrink-0 ${
                        isEvaluating
                          ? "bg-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                      }`}
                      title="ノートの絵と説明を評価し、実物写真を検索"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      {isEvaluating ? "評価中..." : "説明を評価 ＆ 検索"}
                    </button>
                    <button
                      onClick={handleAddMushroomSketch}
                      className="flex items-center gap-1 px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-bold transition-all"
                      title="キノコの手書きスケッチ例を配置"
                    >
                      🍄 キノコ絵サンプル
                    </button>
                    <button
                      onClick={handleAddFlowchartTemplate}
                      className="flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all"
                      title="生態フロー図を配置"
                    >
                      <Workflow className="w-3 h-3" />
                      生態フロー
                    </button>
                    <button
                      onClick={() => toggleMaximize("note")}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                      title={maximizedPane === "note" ? "元のサイズに戻す" : "ノートを最大化"}
                    >
                      {maximizedPane === "note" ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>戻す</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>最大化</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 描画ツールバー ＆ draw.io風ドラッグ＆ドロップ図形パレット */}
                <div className="flex flex-col border-b border-slate-200 bg-white shrink-0">
                  <div className="flex items-center justify-between px-2.5 py-1.5 gap-1 flex-wrap">
                    <div className="flex items-center gap-0.5 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                      <button
                        onClick={() => setActiveTool("select")}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                          activeTool === "select"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-slate-700 hover:bg-white"
                        }`}
                        title="図形をドラッグ移動・青い点(●)から矢印を伸ばして接続"
                      >
                        <MousePointer className="w-3 h-3" />
                        選択/接続
                      </button>
                      <button
                        onClick={() => setActiveTool("draw")}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                          activeTool === "draw"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-slate-700 hover:bg-white"
                        }`}
                        title="フリーハンドでキノコの絵を描く"
                      >
                        <Pencil className="w-3 h-3" />
                        ペン
                      </button>
                      <button
                        onClick={() => setActiveTool("arrow")}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                          activeTool === "arrow"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-slate-700 hover:bg-white"
                        }`}
                        title="図形から図形へドラッグして矢印で接続"
                      >
                        <MoveRight className="w-3 h-3" />
                        コネクタ線
                      </button>
                      <button
                        onClick={() => setActiveTool("text")}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-bold transition-all ${
                          activeTool === "text"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-slate-700 hover:bg-white"
                        }`}
                      >
                        <Type className="w-3 h-3" />
                        文字
                      </button>
                    </div>

                    {/* カラーパレット & クリア */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 rounded-lg border border-slate-200">
                        {[
                          { color: "#2563eb", label: "青(水分/菌糸)" },
                          { color: "#059669", label: "緑(森林/共生)" },
                          { color: "#b45309", label: "茶(キノコ)" },
                          { color: "#7c3aed", label: "紫(プロセス)" },
                          { color: "#dc2626", label: "赤(要注意)" },
                          { color: "#0f172a", label: "黒" },
                        ].map((c) => (
                          <button
                            key={c.color}
                            onClick={() => {
                              setCurrentColor(c.color);
                              if (selectedElementId) {
                                setElements((prev) =>
                                  prev.map((el) =>
                                    el.id === selectedElementId
                                      ? { ...el, color: c.color, bgColor: `${c.color}18` }
                                      : el
                                  )
                                );
                              }
                            }}
                            style={{ backgroundColor: c.color }}
                            className={`w-3.5 h-3.5 rounded-full transition-transform ${
                              currentColor === c.color
                                ? "scale-125 ring-2 ring-emerald-500 ring-offset-1"
                                : "opacity-75 hover:opacity-100"
                            }`}
                            title={c.label}
                          />
                        ))}
                      </div>

                      {selectedElementId && (
                        <button
                          onClick={() => {
                            setElements((prev) =>
                              prev.filter(
                                (el) =>
                                  el.id !== selectedElementId &&
                                  el.fromId !== selectedElementId &&
                                  el.toId !== selectedElementId
                              )
                            );
                            setSelectedElementId(null);
                          }}
                          className="p-1 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded text-[11px]"
                          title="選択要素を削除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setElements([]);
                          setSelectedElementId(null);
                        }}
                        className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200"
                        title="全消去"
                      >
                        クリア
                      </button>
                      <button
                        onClick={handleDownload}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200"
                        title="スケッチを画像保存"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* draw.io風 ドラッグ＆ドロップ図形パレット ＆ 線スタイル切替バー */}
                  <div className="flex items-center justify-between px-2.5 py-1 bg-slate-50/90 border-t border-slate-100 gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 mr-0.5">
                        📦 D&D図形配置:
                      </span>
                      {(
                        [
                          { kind: "rect" as ShapeKind, label: "四角ボックス", icon: Square },
                          {
                            kind: "rounded" as ShapeKind,
                            label: "角丸カプセル",
                            icon: GitCommitHorizontal,
                          },
                          { kind: "diamond" as ShapeKind, label: "ひし形(分岐)", icon: Diamond },
                          { kind: "ellipse" as ShapeKind, label: "楕円(発生)", icon: Circle },
                        ] as const
                      ).map((item) => {
                        const IconComp = item.icon;
                        return (
                          <div
                            key={item.kind}
                            draggable
                            onDragStart={(e) => handlePaletteDragStart(e, item.kind)}
                            onClick={() => setActiveTool(item.kind)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-grab active:cursor-grabbing select-none border transition-all ${
                              activeTool === item.kind
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                                : "bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50"
                            }`}
                            title="キャンバスへドラッグ＆ドロップ（またはクリック）で図形を配置！"
                          >
                            <IconComp className="w-3 h-3 text-indigo-600 shrink-0" />
                            <span>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* コネクタ線種切替 (曲線 / 折れ線 / 直線) */}
                    <div className="flex items-center gap-0.5 bg-white px-1 py-0.5 rounded border border-slate-200 text-[10px]">
                      <span className="text-slate-400 font-semibold px-1">線:</span>
                      {(
                        [
                          { id: "curved" as ConnectorStyle, label: "曲線" },
                          { id: "orthogonal" as ConnectorStyle, label: "折れ線" },
                          { id: "straight" as ConnectorStyle, label: "直線" },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          onClick={() => {
                            setConnectorStyle(st.id);
                            if (selectedElementId) {
                              setElements((prev) =>
                                prev.map((el) =>
                                  el.id === selectedElementId && el.type === "arrow"
                                    ? { ...el, connectorStyle: st.id }
                                    : el
                                )
                              );
                            }
                          }}
                          className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                            connectorStyle === st.id
                              ? "bg-indigo-100 text-indigo-700"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 選択中要素のテキスト編集バー ＆ クイック接続ノード追加 */}
                {selectedElementId && (
                  <div className="px-2.5 py-1 bg-emerald-50 border-b border-emerald-200 flex items-center gap-1.5 text-xs shrink-0 flex-wrap">
                    <span className="text-emerald-800 font-bold text-[11px] whitespace-nowrap">
                      ✏️ ラベル編集:
                    </span>
                    <input
                      ref={labelInputRef}
                      type="text"
                      value={
                        editingTextId === selectedElementId
                          ? editTextValue
                          : elements.find((el) => el.id === selectedElementId)?.text || ""
                      }
                      onFocus={() => {
                        const target = elements.find((el) => el.id === selectedElementId);
                        setEditingTextId(selectedElementId);
                        setEditTextValue(target?.text || "");
                      }}
                      onChange={(e) => {
                        setEditingTextId(selectedElementId);
                        setEditTextValue(e.target.value);
                        setElements((prev) =>
                          prev.map((el) =>
                            el.id === selectedElementId ? { ...el, text: e.target.value } : el
                          )
                        );
                      }}
                      placeholder="文字を入力（矢印のラベルも入力可）..."
                      className="flex-1 min-w-[120px] px-2 py-0.5 bg-white border border-emerald-400 rounded font-bold text-slate-800 text-xs focus:outline-none"
                    />
                    {elements.find((el) => el.id === selectedElementId)?.type === "rect" && (
                      <button
                        onClick={() => {
                          const src = elements.find((el) => el.id === selectedElementId);
                          if (!src) return;
                          const canvasW = canvasRef.current?.width || 480;
                          const w = src.width || 148;
                          const h = src.height || 52;
                          const placeRight = src.x + w + 180 < canvasW;
                          const nextX = placeRight ? src.x + w + 115 : src.x + w / 2;
                          const nextY = placeRight ? src.y + h / 2 : src.y + h + 65;
                          const newNode = createShapeNode("rect", nextX, nextY, "次のステップ");
                          const newArrow: CanvasElement = {
                            id: `arrow-${Date.now()}`,
                            type: "arrow",
                            x: src.x + w,
                            y: src.y + h / 2,
                            fromId: src.id,
                            fromPort: placeRight ? "right" : "bottom",
                            toId: newNode.id,
                            toPort: placeRight ? "left" : "top",
                            connectorStyle,
                            text: "",
                            color: currentColor,
                          };
                          setElements((prev) => [...prev, newNode, newArrow]);
                          setSelectedElementId(newNode.id);
                          setEditingTextId(newNode.id);
                          setEditTextValue(newNode.text || "");
                        }}
                        className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold whitespace-nowrap shadow-2xs"
                        title="選択中の図形から矢印で繋がった次の図形をワンクリック追加"
                      >
                        ＋ 接続ノード追加
                      </button>
                    )}
                  </div>
                )}

                {/* 描画キャンバス本体（D&D・ポート接続・ダブルクリック編集対応） */}
                <div
                  ref={containerRef}
                  className="flex-1 relative cursor-crosshair overflow-hidden bg-white min-h-[160px]"
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onDoubleClick={handleCanvasDoubleClick}
                    onDragOver={handleCanvasDragOver}
                    onDrop={handleCanvasDrop}
                    className="absolute inset-0 block"
                  />
                </div>

                {/* ノート下部：音声・テキスト説明入力 ＆ 実行ボタン */}
                <div className="p-2.5 bg-slate-50 border-t border-slate-200 space-y-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleRecording}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 ${
                        isRecording
                          ? "bg-rose-600 text-white animate-pulse"
                          : "bg-slate-800 text-white hover:bg-slate-900"
                      }`}
                    >
                      {isRecording ? (
                        <MicOff className="w-3.5 h-3.5" />
                      ) : (
                        <Mic className="w-3.5 h-3.5" />
                      )}
                      {isRecording ? "停止" : "声で説明"}
                    </button>

                    <input
                      type="text"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      placeholder="キノコの特徴や生える理由を説明（例: アカマツの根元に生え、秋雨の後に一斉に傘を開きます）..."
                      className="flex-1 px-2.5 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
                    />
                  </div>

                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating}
                    className={`w-full py-2 px-3 rounded-xl font-extrabold text-white text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all ${
                      isEvaluating
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:opacity-95 active:scale-[0.99]"
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {isEvaluating
                      ? "AI評価 ＆ 実物キノコ写真検索 ＆ キノコマップ連携中..."
                      : "✨ 説明を評価 ＆ 実物キノコ写真を検索 ＆ マップ連携！"}
                  </button>
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------
                【一番左の一番下】説明の評価ドック (Evaluation Dock)
               ------------------------------------------------------------- */}
            {maximizedPane !== "note" && (
              <div
                className={`flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden ${
                  maximizedPane === "eval" ? "flex-1" : "h-[40%]"
                }`}
              >
                {/* 評価ヘッダー */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <div>
                      <h2 className="text-xs font-extrabold text-slate-900 leading-none">
                        説明の評価（マルチエージェント赤ペン添削）
                      </h2>
                      <span className="text-[10px] text-slate-500">
                        上のノート・解説に対するAI採点と改善フィードバック
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {result && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
                        {result.score}点
                      </span>
                    )}
                    <button
                      onClick={() => toggleMaximize("eval")}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                      title={
                        maximizedPane === "eval" ? "元のサイズに戻す" : "評価パネルを最大化"
                      }
                    >
                      {maximizedPane === "eval" ? (
                        <>
                          <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>戻す</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>最大化</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 評価コンテンツ */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {!result && !isEvaluating && (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-4">
                      <p className="text-xs font-semibold text-slate-600">
                        上のノートで絵と説明を書いてボタンを押すと、ここに評価が表示されます
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        👦小学生目線・🍄キノコ専門家目線・✍️赤ペン先生が同時採点！
                      </p>
                    </div>
                  )}

                  {isEvaluating && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-6 space-y-2">
                      <div className="w-7 h-7 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-700">
                        説明のわかりやすさと生態学的正確性を採点中...
                      </p>
                    </div>
                  )}

                  {result && !isEvaluating && (
                    <>
                      {/* 総合サマリ & 3指標 */}
                      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-xl p-3 text-white">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
                            🍄 特定種: {result.mushroomName || "信州キノコ"}
                          </span>
                          <div className="flex items-center gap-2 text-[11px]">
                            <span>平易さ {result.feynmanCheck.simplicity}%</span>
                            <span>•</span>
                            <span>構造 {result.feynmanCheck.structure}%</span>
                            <span>•</span>
                            <span>正確性 {result.feynmanCheck.clarity}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-emerald-50 leading-relaxed">{result.summary}</p>
                      </div>

                      {/* 説明の評価 & 絵の評価 */}
                      {result.explanationEvaluation && (
                        <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                            <span>🗣️ 説明の評価</span>
                            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                              {result.explanationEvaluation.score}点
                            </span>
                          </div>
                          <p className="text-xs text-blue-950 leading-snug">
                            {result.explanationEvaluation.comment}
                          </p>
                        </div>
                      )}

                      {result.drawingEvaluation && (
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                            <span>🎨 描いた絵の評価</span>
                            <span className="bg-amber-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                              {result.drawingEvaluation.score}点
                            </span>
                          </div>
                          <p className="text-xs text-amber-950 leading-snug">
                            {result.drawingEvaluation.comment}
                          </p>
                        </div>
                      )}

                      {/* エージェントコメント */}
                      {result.agents && (
                        <div className="grid grid-cols-1 gap-2">
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-[11px] font-bold text-slate-800 mb-0.5">
                              {result.agents.kid.name}
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                              {result.agents.kid.comment}
                            </p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-[11px] font-bold text-slate-800 mb-0.5">
                              {result.agents.expert.name}
                            </div>
                            <p className="text-xs text-slate-600 leading-snug">
                              {result.agents.expert.comment}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 赤ペン改善アドバイス */}
                      <div className="p-2.5 bg-rose-50/80 rounded-xl border border-rose-200">
                        <div className="flex items-center gap-1 text-xs font-bold text-rose-800 mb-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          赤ペン改善アドバイス
                        </div>
                        <ul className="text-xs text-rose-900 space-y-1">
                          {result.redPenAdvice.map((adv, i) => (
                            <li key={i} className="flex items-start gap-1 leading-snug">
                              <span className="font-bold text-rose-600 shrink-0">✍️</span>
                              <span>{adv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* フォルダ指定して保存 */}
                      <div className="pt-1 flex items-center gap-2">
                        <select
                          value={saveFolder}
                          onChange={(e) => setSaveFolder(e.target.value)}
                          className="px-2 py-1.5 text-xs rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                        >
                          {FOLDER_CATEGORIES.filter((c) => c !== "すべて").map((cat) => (
                            <option key={cat} value={cat}>
                              📁 {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleSaveToAssets}
                          disabled={isSaved}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                            isSaved
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-800 hover:bg-slate-900 text-white"
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> 保存完了
                            </>
                          ) : (
                            <>
                              <Archive className="w-3.5 h-3.5" /> 図鑑フォルダに保存
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* -----------------------------------------------------------------
            【真ん中】書いたキノコをもとに実物写真を検索 (Center Pane)
           ----------------------------------------------------------------- */}
        {(maximizedPane === "none" || maximizedPane === "center") && (
          <div
            className={`flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-200 ${
              maximizedPane === "center" ? "w-full flex-1" : "w-[30%] min-w-[300px]"
            }`}
          >
            {/* 中央ペインヘッダー */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-gradient-to-r from-amber-50/80 via-yellow-50/60 to-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  🍄
                </span>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900 leading-none">
                    実物キノコ検索 ＆ 生態写真ギャラリー
                  </h2>
                  <span className="text-[10px] text-slate-500">
                    描いたキノコや説明をもとにWikipedia/Wikimediaから実物写真を検索
                  </span>
                </div>
              </div>

              <button
                onClick={() => toggleMaximize("center")}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                title={
                  maximizedPane === "center"
                    ? "元のサイズに戻す"
                    : "実物キノコ検索画面を最大化"
                }
              >
                {maximizedPane === "center" ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>戻す</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>最大化</span>
                  </>
                )}
              </button>
            </div>

            {/* キノコ検索入力バー ＆ クイックタグ */}
            <div className="p-2.5 border-b border-slate-200 bg-amber-50/40 space-y-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mushroomSearchQuery}
                    onChange={(e) => setMushroomSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearchMushroom(mushroomSearchQuery);
                    }}
                    placeholder={currentMushroomTitle || "キノコ名（例: ベニテングタケ、マツタケ）"}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 font-medium"
                  />
                </div>
                <button
                  onClick={() => handleSearchMushroom(mushroomSearchQuery)}
                  disabled={isSearchingMushroom}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 shrink-0 transition-all"
                >
                  <Search className="w-3 h-3" />
                  検索
                </button>
              </div>

              {/* クイックキノコタグ */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px]">
                <span className="text-slate-400 shrink-0 font-bold">候補:</span>
                {[
                  "ベニテングタケ",
                  "タマゴタケ",
                  "マツタケ",
                  "ツキヨタケ",
                  "ドクツルタケ",
                  "ヤマドリタケモドキ",
                  "マイタケ",
                ].map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setMushroomSearchQuery(name);
                      handleSearchMushroom(name);
                    }}
                    className="px-2 py-0.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 shrink-0 font-medium transition-all"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 中央ペインメイン */}
            <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-between space-y-3">
              {isSearchingMushroom && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-amber-200 rounded-2xl bg-amber-50/20 space-y-3">
                  <div className="w-11 h-11 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      🔍 実物キノコ写真を検索中...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Wikipedia および Wikimedia Commons から高画質な実物生態写真を取得しています
                    </p>
                  </div>
                </div>
              )}

              {!isSearchingMushroom && !activeBananaImage && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-amber-200 rounded-2xl bg-amber-50/30 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-2xl shadow-xs">
                    🔍
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      書いたキノコの実物写真を検索！
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      左の黒板でキノコを描いて「説明を評価 ＆ 実物キノコ写真を検索」を押すか、<br />
                      上の検索窓・候補タグからキノコ名を選ぶと、Wikipedia/Wikimedia から実物生態写真をここに表示します。
                    </p>
                  </div>
                  <button
                    onClick={() => handleSearchMushroom(result?.mushroomName || "ベニテングタケ")}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Search className="w-4 h-4" />
                    ベニテングタケの実物写真を検索してみる
                  </button>
                </div>
              )}

              {!isSearchingMushroom && activeBananaImage && (
                <div className="space-y-3 flex-1 flex flex-col">
                  {/* 実物写真ビューア（手書きスケッチ比較モード対応） */}
                  <div className="relative flex-1 min-h-[240px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md flex flex-col">
                    {compareSketchMode && latestSketchUrl ? (
                      <div className="grid grid-cols-2 gap-1 h-full flex-1 bg-slate-950 p-1">
                        <div className="relative bg-white rounded-xl overflow-hidden flex flex-col">
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                            ✏️ 描いた手書き絵
                          </span>
                          <img
                            src={latestSketchUrl}
                            alt="手書きスケッチ"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="relative bg-slate-900 rounded-xl overflow-hidden flex flex-col">
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                            📷 実物写真: {currentMushroomTitle}
                          </span>
                          <img
                            src={activeBananaImage}
                            alt={`${currentMushroomTitle} 実物写真`}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="relative flex-1 flex items-center justify-center bg-slate-950">
                        <img
                          src={activeBananaImage}
                          alt={`${currentMushroomTitle} 実物写真`}
                          className="w-full h-full max-h-[460px] object-contain"
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/95 text-slate-950 text-[11px] font-extrabold shadow-md">
                            📷 実物写真
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-slate-900/85 text-white text-[11px] font-bold border border-white/20">
                            {currentMushroomTitle}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 📷 説明したキノコの実物検索画像ギャラリー（Wikipedia / Wikimedia Commons） */}
                  {currentSearchImages && currentSearchImages.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                          <span>📷</span>
                          <span>実物検索写真 ({currentSearchImages.length}枚) - クリックで拡大</span>
                        </span>
                        {currentWikiUrl && (
                          <a
                            href={currentWikiUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 transition-all"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Wikipediaで詳しく
                          </a>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        {currentSearchImages.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedSearchImg(img.url)}
                            className={`relative rounded-lg overflow-hidden border aspect-video cursor-pointer transition-all ${
                              activeBananaImage === img.url
                                ? "border-amber-500 ring-2 ring-amber-400 scale-102 shadow-xs"
                                : "border-slate-300 hover:border-amber-400 opacity-80 hover:opacity-100"
                            }`}
                          >
                            <img
                              src={img.url}
                              alt={img.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-0.5 text-[8px] text-white truncate text-center font-medium">
                              {img.source === "wikipedia" ? "Wiki公式" : "生態写真"}
                            </div>
                          </div>
                        ))}
                      </div>

                      {currentWikiExtract && (
                        <p className="text-[11px] text-amber-900/90 leading-relaxed bg-white/70 p-2 rounded-lg border border-amber-200/60 line-clamp-3">
                          {currentWikiExtract}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 比較切替 & 検索アクション */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCompareSketchMode(!compareSketchMode)}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                        compareSketchMode
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {compareSketchMode ? "実物写真を単独表示" : "描いた絵と並べて比較"}
                    </button>

                    <button
                      onClick={() => handleSearchMushroom(currentMushroomTitle)}
                      disabled={isSearchingMushroom}
                      className="py-2 px-3 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-1.5 shadow-xs transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      実物写真を再検索
                    </button>
                  </div>

                  {/* 絵の特徴フィードバック */}
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-900">
                        🎨 スケッチと実物の生態観察ポイント
                      </span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed">
                      {result?.drawingEvaluation?.comment ||
                        "キャンバスに描かれたキノコの傘の形・ヒダ・ツバ・ツボなどの特徴を、実物の生態写真と比較して観察・学習できます。"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -----------------------------------------------------------------
            【一番右】原田さんの「キノコどこどこ」生息地マップ (Right Pane)
           ----------------------------------------------------------------- */}
        {(maximizedPane === "none" || maximizedPane === "right") && (
          <div
            className={`flex flex-col bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden transition-all duration-200 ${
              maximizedPane === "right" ? "w-full flex-1" : "w-[34%] min-w-[330px] flex-1"
            }`}
          >
            {/* 右ペインヘッダー */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                  🍄
                </span>
                <div>
                  <h2 className="text-xs font-extrabold text-slate-900 leading-none">
                    キノコどこどこ（生息地マップ）
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {partnerMapUrl && (
                  <a
                    href={partnerMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all shadow-2xs"
                    title="別タブでキノコどこどこを全画面表示"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>別タブ全画面</span>
                  </a>
                )}

                <button
                  onClick={() => toggleMaximize("right")}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all"
                  title={maximizedPane === "right" ? "元のサイズに戻す" : "マップを最大化"}
                >
                  {maximizedPane === "right" ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>戻す</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>最大化</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 右ペインコンテンツ: 3画面時は余分なUIを排除しマップのみ100%表示 */}
            <div className="flex-1 w-full h-full overflow-hidden bg-slate-900 relative">
              <iframe
                src={partnerMapUrl}
                title="Harada-san Kinoko Dokodoko Map"
                className="w-full h-full border-0 absolute inset-0"
                allow="geolocation; camera; microphone"
              />
            </div>
          </div>
                )}
      </div>
    </div>
  );
}
