import { IssuingBody } from "./issuing-body.model";

export interface Permit {
  id: string;
  name: string;
  issuingBodyId?: string;
  issuingBody?: IssuingBody;
  authorizingBody?: string;
  isActive: boolean;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}