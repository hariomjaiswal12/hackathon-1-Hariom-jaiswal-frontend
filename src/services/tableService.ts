import { request } from "./apiClient"
import type {
  LiveFloorData,
  RecommendationResult,
  Table,
  TableStatus,
} from "@/types/api"

export const tableService = {
  async listTables(params?: {
    status?: string
    capacity?: number
    location?: string
    tag?: string
    isActive?: boolean
  }): Promise<Table[]> {
    const res = await request<{ tables: Table[] }>("/tables", { params })
    return res.tables
  },

  async getFloorPlan(): Promise<Table[]> {
    const res = await request<{ tables: Table[] }>("/tables/floor")
    return res.tables
  },

  async getLiveFloor(): Promise<LiveFloorData> {
    const res = await request<LiveFloorData>("/tables/floor/live")
    return res
  },

  async getRecommendation(params: {
    date: string
    time: string
    guests: number
    location?: string
    shape?: string
    tag?: string
  }): Promise<RecommendationResult> {
    const res = await request<{ recommendation: RecommendationResult }>(
      "/tables/recommendation",
      { params }
    )
    return res.recommendation
  },

  async getTable(id: string): Promise<Table> {
    const res = await request<{ table: Table }>(`/tables/${id}`)
    return res.table
  },

  async createTable(data: Partial<Table>): Promise<Table> {
    const res = await request<{ table: Table }>("/tables", {
      method: "POST",
      body: data,
    })
    return res.table
  },

  async updateTable(id: string, data: Partial<Table>): Promise<Table> {
    const res = await request<{ table: Table }>(`/tables/${id}`, {
      method: "PATCH",
      body: data,
    })
    return res.table
  },

  async updateTableStatus(id: string, status: TableStatus): Promise<Table> {
    const res = await request<{ table: Table }>(`/tables/${id}/status`, {
      method: "PATCH",
      body: { status },
    })
    return res.table
  },

  async updateTablePosition(
    id: string,
    position: { x: number; y: number; rotation: number }
  ): Promise<Table> {
    const res = await request<{ table: Table }>(`/tables/${id}/position`, {
      method: "PATCH",
      body: position,
    })
    return res.table
  },

  async deactivateTable(id: string): Promise<Table> {
    const res = await request<{ table: Table }>(`/tables/${id}`, {
      method: "DELETE",
    })
    return res.table
  },
}
