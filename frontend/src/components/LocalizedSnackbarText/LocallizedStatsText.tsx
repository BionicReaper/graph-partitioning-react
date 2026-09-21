import { useTranslation } from 'react-i18next';

type Stats = { initialCutSize: number, finalCutSize: number, passes: number, reads: number, writes: number, additions: number, comparisons: number };

const LocalizedStatsText = ({ stats, algorithmId }: { algorithmId: string, stats: Stats }) => {
    const { t } = useTranslation();
    const lines: [string, number][] = [
        ['StatInitialCutSize', stats.initialCutSize],
        ['StatFinalCutSize', stats.finalCutSize],
        [algorithmId === 'metis' ? 'StatPassesMetis' : 'StatPasses', stats.passes],
        ['StatReads', stats.reads],
        ['StatWrites', stats.writes],
        ['StatAdditions', stats.additions],
        ['StatComparisons', stats.comparisons],
    ];
    return (
        <div>
            <div style={{ fontWeight: 'bold' }}>{t('AlgorithmCompleted')}</div>
            {lines.map(([key, value]) => (
                <div key={key}>{t(key)}: {value}</div>
            ))}
        </div>
    );
};

export default LocalizedStatsText;
