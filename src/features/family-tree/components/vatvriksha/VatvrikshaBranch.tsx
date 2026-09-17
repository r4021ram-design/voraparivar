import React from 'react';
import type { BotanicalBranch } from '../../utils/treeBotanicalLayout';

interface VatvrikshaBranchProps {
    branch: BotanicalBranch;
    theme?: string;
}

export const VatvrikshaBranch: React.FC<VatvrikshaBranchProps> = ({ branch, theme }) => {
    const isRajashahi = theme === 'rajashahi';

    return (
        <g className="vatvriksha-branch-group">
            {/* Kinship Glowing Aura Path */}
            {branch.isHighlighted && (
                <path
                    d={branch.pathData}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={branch.thickness + 16}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-pulse"
                    opacity={0.65}
                    filter="url(#golden-branch-glow)"
                />
            )}

            {/* Deep Shadow Underneath Branch for 3D Depth */}
            <path
                d={branch.pathData}
                fill="none"
                stroke={isRajashahi ? 'rgba(60, 20, 10, 0.4)' : 'rgba(15, 23, 42, 0.35)'}
                strokeWidth={branch.thickness + 3}
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(0, 3)"
            />

            {/* Main Natural Wooden Bark Branch */}
            <path
                d={branch.pathData}
                fill="none"
                stroke={
                    branch.isHighlighted
                        ? '#fbbf24'
                        : isRajashahi
                        ? 'url(#royal-wood-gradient)'
                        : 'url(#natural-wood-gradient)'
                }
                strokeWidth={branch.thickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-300"
            />

            {/* Subtle Lighter Grain Highlight along the Spine */}
            <path
                d={branch.pathData}
                fill="none"
                stroke={branch.isHighlighted ? '#fef3c7' : 'rgba(255, 255, 255, 0.22)'}
                strokeWidth={Math.max(branch.thickness * 0.25, 2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
            />
        </g>
    );
};
