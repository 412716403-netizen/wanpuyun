export type StageStatus = "pending" | "in_progress" | "completed" | "error";

export interface Field {
  id: string;
  label: string;
  type: "text" | "file" | "image" | "number";
  value: any;
}

export interface Stage {
  id: string;
  name: string;
  status: StageStatus;
  updatedAt: string;
  fields: Field[];
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
  }[];
}

export interface LogEntry {
  id: string;
  user: string;
  action: string;
  detail: string;
  time: string;
}

export interface SampleVersion {
  id: string;
  name: string;
  isHistory?: boolean;
  stages: Stage[];
  logs: LogEntry[];
}

export interface ProductCustomField {
  id: string;
  label: string;
  value: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  customFields: ProductCustomField[];
  status: "developing" | "archived";
  isSynced: boolean;
  createdAt: string;
  image?: string;
  samples: SampleVersion[];
}

