import { memo } from 'react';
import { BaseEdge, type EdgeProps, getBezierPath } from 'reactflow';

const CustomEdge = (props: EdgeProps) => {
    const [edgePath] = getBezierPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        sourcePosition: props.sourcePosition,
        targetX: props.targetX,
        targetY: props.targetY,
        targetPosition: props.targetPosition,
    });

    return (
        <BaseEdge
            path={edgePath}
            {...props}
        />
    );
};

export default memo(CustomEdge);
