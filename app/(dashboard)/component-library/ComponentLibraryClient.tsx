"use client"

import { useState, useCallback, useEffect } from "react"
import { Save, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Request } from "@/lib/models"
import { BRAND_COLORS } from "@/lib/config"
import { REQUEST_STATUS } from "@/lib/constants"
import { saveTheme } from "@/actions/theme"
import type { TenantTheme, ThemeTokens } from "@/services"

// ── Token configuration ─────────────────────────────────────────────────────

const COLOR_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "brand-primary", label: "Primary" },
  { key: "brand-primary-dark", label: "Primary Dark" },
  { key: "brand-accent", label: "Accent" },
  { key: "brand-surface", label: "Surface" },
  { key: "brand-surface-alt", label: "Surface Alt" },
  { key: "brand-dark", label: "Dark" },
  { key: "brand-sidebar", label: "Sidebar" },
]

const TEXT_TOKENS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "brand-font-display", label: "Display Font" },
  { key: "brand-font-body", label: "Body Font" },
  { key: "brand-font-mono", label: "Mono Font" },
  { key: "brand-radius", label: "Border Radius" },
  { key: "brand-glow-opacity", label: "Glow Opacity" },
  { key: "brand-card-blur", label: "Card Blur" },
  { key: "brand-sidebar-width", label: "Sidebar Width" },
]

const DEFAULT_TOKENS: ThemeTokens = {
  "brand-primary": BRAND_COLORS.navy,
  "brand-primary-dark": BRAND_COLORS.navyDark,
  "brand-accent": BRAND_COLORS.gold,
  "brand-surface": BRAND_COLORS.cream,
  "brand-surface-alt": BRAND_COLORS.creamAlt,
  "brand-dark": BRAND_COLORS.dark,
  "brand-sidebar": BRAND_COLORS.sidebar,
  "brand-font-display": '"Playfair Display", Georgia, serif',
  "brand-font-body": '"Outfit", system-ui, sans-serif',
  "brand-font-mono": '"Geist Mono", monospace',
  "brand-radius": "0.5rem",
  "brand-glow-opacity": "0.08",
  "brand-card-blur": "12px",
  "brand-sidebar-width": "260px",
}

const ALL_STATUSES = Object.values(REQUEST_STATUS)

const MOCK_REQUEST = Request.fromDTO({
  id: "preview-1",
  queueNumber: 42,
  title: "Spring Open House Flyer",
  materialType: "Flyer",
  status: "in_progress",
  isRush: true,
  requesterName: "Yong Choi",
  designerName: "Marcus Chen",
  dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
  submittedAt: new Date().toISOString(),
  slaDeadline: new Date(Date.now() + 2 * 86400000).toISOString(),
  slaBreached: false,
  brief: "Full-page flyer for the spring listing campaign.",
  assignedTo: "designer-1",
  requesterId: "agent-1",
  messages: [],
  files: [],
})

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  currentTheme: TenantTheme | null
  allThemes: TenantTheme[]
}

export function ComponentLibraryClient({ currentTheme, allThemes }: Props) {
  const [tokens, setTokens] = useState<ThemeTokens>(
    currentTheme?.tokens ?? DEFAULT_TOKENS
  )
  const [themeName, setThemeName] = useState(
    currentTheme?.themeName ?? "Default"
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedThemeId, setSelectedThemeId] = useState(
    currentTheme?.id ?? ""
  )

  // Live-preview: apply token changes to CSS vars
  useEffect(() => {
    const root = document.documentElement
    for (const [key, value] of Object.entries(tokens)) {
      root.style.setProperty(`--${key}`, value)
    }
  }, [tokens])

  const handleTokenChange = useCallback(
    (key: keyof ThemeTokens, value: string) => {
      setTokens((prev) => ({ ...prev, [key]: value }))
      setSaved(false)
    },
    []
  )

  function handleThemeSelect(id: string | null) {
    if (!id) return
    const selected = allThemes.find((t) => t.id === id)
    if (selected) {
      setTokens(selected.tokens)
      setThemeName(selected.themeName)
      setSelectedThemeId(id)
      setSaved(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveTheme(themeName, tokens)
      setSaved(true)
    } catch (err) {
      console.error("Failed to save theme:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Design System</h1>
          <p className="text-sm text-muted-foreground">
            Edit tokens and preview components in real-time
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saved ? <Check className="size-4" /> : <Save className="size-4" />}
          {saving ? "Saving..." : saved ? "Saved" : "Save Theme"}
        </Button>
      </div>

      {/* Theme Selector */}
      {allThemes.length > 0 && (
        <Card>
          <CardContent className="flex items-center gap-4 pt-4">
            <div className="grid gap-2">
              <Label>Active Theme</Label>
              <Select value={selectedThemeId} onValueChange={handleThemeSelect}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select theme..." />
                </SelectTrigger>
                <SelectContent>
                  {allThemes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.themeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="theme-name">Theme Name</Label>
              <Input
                id="theme-name"
                value={themeName}
                onChange={(e) => {
                  setThemeName(e.target.value)
                  setSaved(false)
                }}
                placeholder="Theme name"
                className="w-48"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens</CardTitle>
          <CardDescription>
            Color and typography tokens applied to all components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color tokens */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Colors
            </Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {COLOR_TOKENS.map(({ key, label }) => (
                <div key={key} className="grid gap-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tokens[key]}
                      onChange={(e) => handleTokenChange(key, e.target.value)}
                      className="size-8 cursor-pointer rounded border border-input"
                    />
                    <Input
                      value={tokens[key]}
                      onChange={(e) => handleTokenChange(key, e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Text tokens */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Typography & Layout
            </Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {TEXT_TOKENS.map(({ key, label }) => (
                <div key={key} className="grid gap-1.5">
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={tokens[key]}
                    onChange={(e) => handleTokenChange(key, e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Component Preview</CardTitle>
          <CardDescription>
            Live preview reflecting current token values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Status Badges */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status Badges
            </Label>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((s) => {
                const r = Request.fromDTO({ ...MOCK_REQUEST.dto, status: s })
                return (
                  <Badge
                    key={s}
                    className={cn("pointer-events-none", r.statusColor)}
                  >
                    {r.statusLabel}
                  </Badge>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Rush Badge */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Rush Badge
            </Label>
            <Badge variant="destructive">Rush</Badge>
          </div>

          <Separator />

          {/* Sample Request Card */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Request Card
            </Label>
            <Card className={cn("max-w-xl border-l-4", MOCK_REQUEST.statusBorderColor)}>
              <CardContent>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {MOCK_REQUEST.queueLabel}
                      </span>
                      <h3 className="truncate text-sm font-medium">
                        {MOCK_REQUEST.title}
                      </h3>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <Badge className={cn("pointer-events-none", MOCK_REQUEST.statusColor)}>
                        {MOCK_REQUEST.statusLabel}
                      </Badge>
                      {MOCK_REQUEST.isRush && (
                        <Badge variant="destructive">Rush</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {MOCK_REQUEST.materialType}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>{MOCK_REQUEST.requesterName}</p>
                    <p>Due {MOCK_REQUEST.dueDateFormatted}</p>
                    <p className={MOCK_REQUEST.slaDisplayColor}>
                      {MOCK_REQUEST.slaDisplay}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* KPI Cards */}
          <div>
            <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              KPI Cards
            </Label>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Total Requests", value: "128" },
                { label: "Completed", value: "94" },
                { label: "Avg Turnaround", value: "1.8d" },
                { label: "SLA Breach", value: "4.2%" },
              ].map((kpi) => (
                <Card key={kpi.label} size="sm">
                  <CardHeader>
                    <CardDescription>{kpi.label}</CardDescription>
                    <CardTitle className="text-2xl tabular-nums">
                      {kpi.value}
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
