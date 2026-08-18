import type { SeasonViewData } from '../seasons/types';
import type { TodayDiaryData } from '../today/types';

export interface ProgressPanelData {
    todaySp: number;
    season: SeasonViewData & { id: number; day: number; state: 'current' };
    diary: TodayDiaryData;
}
