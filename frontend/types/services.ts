/** Public service-card fields returned by Craft's GET /api/services endpoint. */
export type ServiceGroup = 'Maintain' | 'Restore' | 'Brighten'

export interface DentalService {
  id: number
  name: string
  group: ServiceGroup
  icon: 'tooth' | 'shield' | 'restore' | 'crown' | 'smile' | 'sparkle'
  description: string
  tag: string
}
