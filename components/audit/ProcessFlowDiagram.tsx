'use client';

import React, { useMemo } from 'react';
import { ReactFlow, Background, Controls, Node, Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AuditProcessStep } from '@/lib/types';

interface ProcessFlowDiagramProps {
  steps: AuditProcessStep[];
  height?: number;
}

const COL_WIDTH = 260;
const ROW_HEIGHT = 90;

export function ProcessFlowDiagram({ steps, height = 480 }: ProcessFlowDiagramProps) {
  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    n.push({
      id: 'before-label',
      position: { x: 0, y: -60 },
      data: { label: 'AVANT (processus actuel)' },
      style: { background: 'transparent', border: 'none', fontWeight: 800, fontSize: 12, color: '#a8ab9f', width: COL_WIDTH },
      draggable: false,
      selectable: false,
    });
    n.push({
      id: 'after-label',
      position: { x: COL_WIDTH + 120, y: -60 },
      data: { label: 'APRÈS MINERVA (OPTIMISÉ)' },
      style: { background: 'transparent', border: 'none', fontWeight: 800, fontSize: 12, color: '#059669', width: COL_WIDTH },
      draggable: false,
      selectable: false,
    });

    steps.forEach((step, i) => {
      const y = i * ROW_HEIGHT;
      const isFriction = step.is_bottleneck || step.is_duplicate_entry;

      n.push({
        id: `before-${step.id}`,
        position: { x: 0, y },
        data: { label: step.title },
        sourcePosition: Position.Right,
        style: {
          width: COL_WIDTH,
          background: isFriction ? '#fdeceb' : '#f7f6f0',
          border: isFriction ? '1.5px solid #d9483a' : '1px solid #e5e3da',
          borderRadius: 10,
          padding: 10,
          fontSize: 11,
          fontWeight: 600,
        },
      });

      if (isFriction) {
        n.push({
          id: `after-${step.id}`,
          position: { x: COL_WIDTH + 120, y },
          data: { label: `${step.title} — Automatisé` },
          targetPosition: Position.Left,
          style: {
            width: COL_WIDTH,
            background: '#e6f5ee',
            border: '1.5px solid #059669',
            borderRadius: 10,
            padding: 10,
            fontSize: 11,
            fontWeight: 600,
            color: '#059669',
          },
        });
        e.push({
          id: `edge-${step.id}`,
          source: `before-${step.id}`,
          target: `after-${step.id}`,
          animated: true,
          style: { stroke: '#059669', strokeWidth: 2 },
        });
      }
    });

    return { nodes: n, edges: e };
  }, [steps]);

  if (steps.length === 0) return null;

  return (
    <div style={{ height }} className="bg-mv-cream-soft border border-mv-border rounded-xl overflow-hidden">
      <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.3 }} proOptions={{ hideAttribution: true }} nodesDraggable={false} nodesConnectable={false}>
        <Background color="#e5e3da" gap={20} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
