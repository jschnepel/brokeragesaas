"use client"

import { useState, useCallback } from "react"
import { Save, Check, Plus, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  INIT_MATERIALS,
  INIT_RUSH_FEES,
  INIT_DESIGNERS,
  INIT_OFFICES,
  NOTIF_RULES,
  ALL_FIELDS,
  INIT_UNASSIGNED,
  type MaterialSetting,
  type RushFee,
  type Designer,
  type Office,
  type NotifRule,
  type FieldConfig,
  type FieldVisibility,
  type UnassignedRequest,
} from "@/lib/data/settings"

// ── Save Button helper ──────────────────────────────────────────────────────

function useSaveState() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(async () => {
    setSaving(true)
    // Simulate async save
    await new Promise((r) => setTimeout(r, 400))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [])

  return { saving, saved, handleSave }
}

function SaveButton({ saving, saved, onClick }: { saving: boolean; saved: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} disabled={saving} className="ml-auto">
      {saved ? <Check className="size-4" /> : <Save className="size-4" />}
      {saving ? "Saving..." : saved ? "Saved" : "Save Changes"}
    </Button>
  )
}

// ── Materials Tab ───────────────────────────────────────────────────────────

function MaterialsTab() {
  const [materials, setMaterials] = useState<MaterialSetting[]>(() =>
    structuredClone(INIT_MATERIALS)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateMaterial = useCallback(
    (id: string, patch: Partial<MaterialSetting>) => {
      setMaterials((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
      )
    },
    []
  )

  const addMaterial = useCallback(() => {
    const next: MaterialSetting = {
      id: `mat-${Date.now()}`,
      name: "",
      slaHours: 72,
      active: true,
    }
    setMaterials((prev) => [...prev, next])
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material Types</CardTitle>
        <CardDescription>
          Configure available material types and their default SLA hours
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">SLA Hours</TableHead>
              <TableHead className="w-24">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Input
                    value={m.name}
                    onChange={(e) => updateMaterial(m.id, { name: e.target.value })}
                    placeholder="Material name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={m.slaHours}
                    onChange={(e) =>
                      updateMaterial(m.id, { slaHours: Number(e.target.value) })
                    }
                    min={1}
                    className="w-24"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={m.active}
                    onCheckedChange={(checked) =>
                      updateMaterial(m.id, { active: Boolean(checked) })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addMaterial}>
            <Plus className="size-4" />
            Add Material Type
          </Button>
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Rush Fees Tab ───────────────────────────────────────────────────────────

function RushFeesTab() {
  const [fees, setFees] = useState<RushFee[]>(() =>
    structuredClone(INIT_RUSH_FEES)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateFee = useCallback((materialType: string, multiplier: number) => {
    setFees((prev) =>
      prev.map((f) =>
        f.materialType === materialType ? { ...f, multiplier } : f
      )
    )
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rush Fee Multipliers</CardTitle>
        <CardDescription>
          Set the cost multiplier applied when a request is marked as rush
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Type</TableHead>
              <TableHead className="w-40">Multiplier</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fees.map((f) => (
              <TableRow key={f.materialType}>
                <TableCell className="font-medium">{f.materialType}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={f.multiplier}
                    onChange={(e) =>
                      updateFee(f.materialType, Number(e.target.value))
                    }
                    step={0.25}
                    min={1}
                    className="w-28"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Field Config Tab ────────────────────────────────────────────────────────

function FieldConfigTab() {
  const [fields, setFields] = useState<FieldConfig[]>(() =>
    structuredClone(ALL_FIELDS)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateFieldType = useCallback((id: string, type: FieldVisibility) => {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, type } : f))
    )
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Field Configuration</CardTitle>
        <CardDescription>
          Control which fields are required, optional, or hidden on the request
          form
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {fields.map((f) => (
            <div
              key={f.id}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.name}</p>
              </div>
              <RadioGroup
                value={f.type}
                onValueChange={(val) =>
                  updateFieldType(f.id, val as FieldVisibility)
                }
                className="flex w-auto flex-row gap-4"
              >
                {(["required", "optional", "hidden"] as const).map((opt) => (
                  <div key={opt} className="flex items-center gap-1.5">
                    <RadioGroupItem value={opt} id={`${f.id}-${opt}`} />
                    <Label
                      htmlFor={`${f.id}-${opt}`}
                      className="text-xs capitalize"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>
        <div className="flex">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Designer Roster Tab ─────────────────────────────────────────────────────

function DesignerRosterTab() {
  const [designers, setDesigners] = useState<Designer[]>(() =>
    structuredClone(INIT_DESIGNERS)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateDesigner = useCallback(
    (id: string, patch: Partial<Designer>) => {
      setDesigners((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      )
    },
    []
  )

  const addDesigner = useCallback(() => {
    const next: Designer = {
      id: `d-${Date.now()}`,
      name: "",
      email: "",
      capacity: 5,
      active: true,
    }
    setDesigners((prev) => [...prev, next])
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Designer Roster</CardTitle>
        <CardDescription>
          Manage designers available for request assignment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-28">Capacity</TableHead>
              <TableHead className="w-24">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {designers.map((d) => (
              <TableRow key={d.id}>
                <TableCell>
                  <Input
                    value={d.name}
                    onChange={(e) =>
                      updateDesigner(d.id, { name: e.target.value })
                    }
                    placeholder="Designer name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={d.email}
                    onChange={(e) =>
                      updateDesigner(d.id, { email: e.target.value })
                    }
                    placeholder="email@russlyon.com"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={d.capacity}
                    onChange={(e) =>
                      updateDesigner(d.id, { capacity: Number(e.target.value) })
                    }
                    min={1}
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={d.active}
                    onCheckedChange={(checked) =>
                      updateDesigner(d.id, { active: Boolean(checked) })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addDesigner}>
            <Plus className="size-4" />
            Add Designer
          </Button>
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Offices Tab ─────────────────────────────────────────────────────────────

function OfficesTab() {
  const [offices, setOffices] = useState<Office[]>(() =>
    structuredClone(INIT_OFFICES)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateOffice = useCallback(
    (id: string, patch: Partial<Office>) => {
      setOffices((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...patch } : o))
      )
    },
    []
  )

  const addOffice = useCallback(() => {
    const next: Office = {
      id: `o-${Date.now()}`,
      name: "",
      code: "",
      manager: "",
      active: true,
    }
    setOffices((prev) => [...prev, next])
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Office Locations</CardTitle>
        <CardDescription>
          Manage brokerage office locations and their managers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="w-24">Code</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead className="w-24">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offices.map((o) => (
              <TableRow key={o.id}>
                <TableCell>
                  <Input
                    value={o.name}
                    onChange={(e) =>
                      updateOffice(o.id, { name: e.target.value })
                    }
                    placeholder="Office name"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={o.code}
                    onChange={(e) =>
                      updateOffice(o.id, { code: e.target.value })
                    }
                    placeholder="Code"
                    className="w-20"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={o.manager}
                    onChange={(e) =>
                      updateOffice(o.id, { manager: e.target.value })
                    }
                    placeholder="Manager name"
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={o.active}
                    onCheckedChange={(checked) =>
                      updateOffice(o.id, { active: Boolean(checked) })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={addOffice}>
            <Plus className="size-4" />
            Add Office
          </Button>
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Notifications Tab ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [rules, setRules] = useState<NotifRule[]>(() =>
    structuredClone(NOTIF_RULES)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateRule = useCallback(
    (id: string, patch: Partial<NotifRule>) => {
      setRules((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
      )
    },
    []
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Rules</CardTitle>
        <CardDescription>
          Configure which events trigger email and push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead className="w-24 text-center">Email</TableHead>
              <TableHead className="w-24 text-center">Push</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.label}</TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={r.email}
                    onCheckedChange={(checked) =>
                      updateRule(r.id, { email: Boolean(checked) })
                    }
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={r.push}
                    onCheckedChange={(checked) =>
                      updateRule(r.id, { push: Boolean(checked) })
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex">
          <SaveButton saving={saving} saved={saved} onClick={handleSave} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Quick Assign Tab ────────────────────────────────────────────────────────

function QuickAssignTab() {
  const [requests, setRequests] = useState<UnassignedRequest[]>(() =>
    structuredClone(INIT_UNASSIGNED)
  )
  const [designers] = useState(() =>
    INIT_DESIGNERS.filter((d) => d.active)
  )
  const { saving, saved, handleSave } = useSaveState()

  const updateAssignment = useCallback((id: string, assignedTo: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, assignedTo } : r))
    )
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Assign</CardTitle>
        <CardDescription>
          Assign unassigned requests to available designers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead className="w-32">Material</TableHead>
              <TableHead className="w-52">Assign To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {r.materialType}
                  </span>
                </TableCell>
                <TableCell>
                  <Select
                    value={r.assignedTo || undefined}
                    onValueChange={(val) => val && updateAssignment(r.id, val)}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Select designer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {designers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex">
          <Button
            onClick={handleSave}
            disabled={saving || requests.every((r) => !r.assignedTo)}
          >
            <Users className="size-4" />
            {saving ? "Assigning..." : saved ? "Assigned" : "Assign All"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Settings Client ────────────────────────────────────────────────────

export function SettingsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Platform configuration and administration
        </p>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="materials">
        <TabsList className="flex-wrap">
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="rush-fees">Rush Fees</TabsTrigger>
          <TabsTrigger value="fields">Field Config</TabsTrigger>
          <TabsTrigger value="designers">Designers</TabsTrigger>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="quick-assign">Quick Assign</TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <MaterialsTab />
        </TabsContent>

        <TabsContent value="rush-fees">
          <RushFeesTab />
        </TabsContent>

        <TabsContent value="fields">
          <FieldConfigTab />
        </TabsContent>

        <TabsContent value="designers">
          <DesignerRosterTab />
        </TabsContent>

        <TabsContent value="offices">
          <OfficesTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="quick-assign">
          <QuickAssignTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
