import type { OrgNodeData, OrgPerson } from "@/lib/data/orgchart"

const DEPARTMENT_COLORS: Record<string, string> = {
  Executive: "bg-purple-100 text-purple-700",
  Marketing: "bg-blue-100 text-blue-700",
  Sales: "bg-emerald-100 text-emerald-700",
  Operations: "bg-amber-100 text-amber-700",
}

const DEPARTMENT_AVATAR_COLORS: Record<string, string> = {
  Executive: "bg-purple-600",
  Marketing: "bg-blue-600",
  Sales: "bg-emerald-600",
  Operations: "bg-amber-600",
}

export class OrgNode {
  public readonly person: OrgPerson
  public readonly children: OrgNode[]

  constructor(data: OrgNodeData) {
    this.person = data.person
    this.children = data.children.map((c) => new OrgNode(c))
  }

  get name(): string {
    return this.person.name
  }

  get title(): string {
    return this.person.title
  }

  get department(): string {
    return this.person.department
  }

  get email(): string {
    return this.person.email
  }

  get phone(): string | undefined {
    return this.person.phone
  }

  get initials(): string {
    return this.person.initials
  }

  get roleColor(): string {
    return DEPARTMENT_COLORS[this.department] ?? "bg-secondary text-secondary-foreground"
  }

  get avatarColor(): string {
    return DEPARTMENT_AVATAR_COLORS[this.department] ?? "bg-muted-foreground"
  }

  get childCount(): number {
    let count = this.children.length
    for (const child of this.children) {
      count += child.childCount
    }
    return count
  }

  get isLeaf(): boolean {
    return this.children.length === 0
  }

  /** Depth-first flattening of the tree */
  static flatten(root: OrgNode): OrgNode[] {
    const result: OrgNode[] = [root]
    for (const child of root.children) {
      result.push(...OrgNode.flatten(child))
    }
    return result
  }

  /** Check if this node or any descendants match a search query */
  matches(query: string): boolean {
    const q = query.toLowerCase()
    return (
      this.name.toLowerCase().includes(q) ||
      this.title.toLowerCase().includes(q) ||
      this.department.toLowerCase().includes(q)
    )
  }

  static fromData(data: OrgNodeData): OrgNode {
    return new OrgNode(data)
  }
}
