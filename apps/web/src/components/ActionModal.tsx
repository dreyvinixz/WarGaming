import { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import './ActionModal.css';

interface ActionModalProps {
  title: string;
  description: string;
  maxTroops: number;
  onConfirm: (troops: number) => void;
  onCancel: () => void;
}

export function ActionModal({ title, description, maxTroops, onConfirm, onCancel }: ActionModalProps) {
  const [troops, setTroops] = useState(Math.max(1, maxTroops));
  const [lastMax, setLastMax] = useState(maxTroops);

  if (maxTroops !== lastMax) {
    setLastMax(maxTroops);
    setTroops(Math.max(1, maxTroops));
  }

  return (
    <div className="modal-overlay">
      <Card glow className="modal-content">
        <h2>{title}</h2>
        <p className="text-muted">{description}</p>
        
        <Input 
          type="number" 
          label="Quantidade de tropas"
          value={troops} 
          min={1} 
          max={maxTroops}
          onChange={(e) => setTroops(Number(e.target.value))}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>Mínimo: 1</span>
          <span>Máximo: {maxTroops}</span>
        </div>

        <div className="modal-actions">
          <Button variant="secondary" onClick={onCancel}>Voltar</Button>
          <Button variant="primary" onClick={() => onConfirm(troops)}>Confirmar ação</Button>
        </div>
      </Card>
    </div>
  );
}
