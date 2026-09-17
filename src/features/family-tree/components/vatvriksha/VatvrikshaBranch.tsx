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
            {/* Kinship / Hover Glowing Liquid-Gold Aura */}
            {branch.isHighlighted && (
                <>
                    <path
                        d={branch.pathData}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={branch.thickness + 18}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.7}
                        filter="url(#golden-branch-glow)"
                    />
                    <path
                        d={branch.pathData}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth={branch.thickness + 8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.85}
                    />
                </>
            )}

            {/* Deep Shadow Underneath Branch for 3D Bark Elevation */}
            <path
                d={branch.pathData}
                fill="none"
                stroke={isRajashahi ? 'rgba(50, 15, 8, 0.45)' : 'rgba(15, 23, 42, 0.38)'}
                strokeWidth={branch.thickness + 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                transform="translate(0, 3.5)"
            />

            {/* Smooth Wooden Junction Knot at Branch Source */}
            <circle
                cx={branch.sourceX}
                cy={branch.sourceY}
                r={branch.thickness * 0.65}
                fill={isRajashahi ? '#5c1b09' : '#431e08'}
                opacity={0.9}
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

            {/* Subtle Lighter Grain Highlight along the Bark Spine */}
            <path
                d={branch.pathData}
                fill="none"
                stroke={branch.isHighlighted ? '#fef3c7' : 'rgba(255, 255, 255, 0.26)'}
                strokeWidth={Math.max(branch.thickness * 0.22, 2)}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
            />

            {/* Flowing Liquid Energy Stream inside Highlighted Branch */}
            {branch.isHighlighted && (
                <path
                    d={branch.pathData}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={Math.max(branch.thickness * 0.35, 2.5)}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="14 10"
                    className="animate-flowing-vein"
                    opacity={0.95}
                />
            )}
        </g>
    );
};
