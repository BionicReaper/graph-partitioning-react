import { useTranslation } from 'react-i18next';

const LocalizedStatsText = ({ stats }: { stats: { cutSize: number, reads: number, writes: number, additions: number, comparisons: number } }) => {
    const { t } = useTranslation();
    return (
        <>
            {t('AlgorithmCompleted', { 
                cutSize: stats.cutSize,
                reads: stats.reads,
                writes: stats.writes,
                additions: stats.additions,
                comparisons: stats.comparisons
            })}
        </>
    );
};

export default LocalizedStatsText;