export interface MapperTask {
  id: number | string;
  player_name: string;
  steam_id: string;
  assigned_task: string;
  created_at?: string;
}

export interface MapItem {
  id: number;
  name: string;
  type: 'Human' | 'Zombie';
  description: string;
  cooldown: number;
  created_at?: string;
}

export interface MapLocation {
  id: number;
  name: string;
  description: string;
  image_url: string;
  created_at?: string;
}

export interface MapChangelog {
  id: number;
  version: string;
  title: string;
  changes: string;
  status: 'In Progress' | 'Released' | 'Internal Testing' | 'Planned';
  release_date?: string;
}