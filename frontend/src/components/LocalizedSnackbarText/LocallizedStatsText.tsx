import { useTranslation } from 'react-i18next';

const LocalizedStatsText = ({ stats }: { stats: { initialCutSize: number, finalCutSize: number, reads: number, writes: number, additions: number, comparisons: number } }) => {
    const { t } = useTranslation();
    return (
        <>
            {t('AlgorithmCompleted', { 
                initialCutSize: stats.initialCutSize,
                finalCutSize: stats.finalCutSize,
                reads: stats.reads,
                writes: stats.writes,
                additions: stats.additions,
                comparisons: stats.comparisons
            })}
        </>
    );
};

export default LocalizedStatsText;