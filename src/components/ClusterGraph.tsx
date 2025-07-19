'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
// import type { ForceGraphMethods, GraphData } from 'react-force-graph';

type ForceGraph2DComponent = React.ForwardRefExoticComponent<any>;

const ForceGraph2D = dynamic(
  () => import('react-force-graph').then(mod => mod.ForceGraph2D),
  { ssr: false }
) as unknown as ForceGraph2DComponent;

// Dynamically import to avoid SSR issues
// const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => mod.ForceGraph2D), {
//     ssr: false,
// });

export default function ClusterGraph({ data }: { data: any }) {
    const graphRef = useRef<any | null>(null);

    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.zoomToFit(500);
           
        }
    }, [data]);

    return (
        <div className="h-[500px] bg-slate-900/60 rounded-xl p-4 border border-slate-700/30">
            <ForceGraph2D
                {...{ ref: graphRef as any }}
                // ref={graphRef}
                {...{ graphData: data as any }}
                // graphData={data}
                {...{ nodeLabel: "id" as string }}
                // nodeLabel="id"
                {...{ nodeAutoColorBy: "group" as string }}
                // nodeAutoColorBy="group"
                nodeCanvasObjectMode={() => 'before'}
                // nodeCanvasObjectMode={() => 'before'}
                nodeCanvasObject={(node: { id: any; x: any; y: any; }, ctx: { fillStyle: string; font: string; fillText: (arg0: any, arg1: any, arg2: any) => void; }) => {
                    const label = node.id;
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Sans-Serif';
                    ctx.fillText(label, node.x!, node.y!);
                }}
                linkColor={() => 'rgba(255,255,255,0.2)'}
            />
        </div>
    );
}
