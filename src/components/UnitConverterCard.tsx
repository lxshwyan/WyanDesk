import { ArrowDownUp, Ruler } from 'lucide-react';
import { conversionCategories, convertUnit } from '../lib/unitConversion';
import { useWidgetViewState } from './WidgetViewState';
import './unitConverter.css';

export function UnitConverterCard() {
  const [categoryId, setCategoryId] = useWidgetViewState('category', 'length');
  const [from, setFrom] = useWidgetViewState('from', 'm');
  const [to, setTo] = useWidgetViewState('to', 'km');
  const [input, setInput] = useWidgetViewState('input', '1');
  const category = conversionCategories.find((item) => item.id === categoryId) || conversionCategories[0];
  const result = convertUnit(input, category.id, from, to);
  function chooseCategory(id: string) {
    const next = conversionCategories.find((item) => item.id === id)!;
    setCategoryId(id); setFrom(next.units[0].id); setTo(next.units[1].id);
  }
  return <section className="glass-panel converter-card">
    <div className="mini-heading"><span><Ruler aria-hidden="true" />单位换算</span><select aria-label="换算类型" value={category.id} onChange={(event) => chooseCategory(event.target.value)}>{conversionCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></div>
    <div className="converter-fields">
      <div className="converter-row"><input aria-label="待换算数值" inputMode="decimal" type="text" maxLength={80} value={input} onChange={(event) => setInput(event.target.value)} /><select aria-label="原单位" value={from} onChange={(event) => setFrom(event.target.value)}>{category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></div>
      <button className="converter-swap" type="button" aria-label="交换换算单位" onClick={() => { setFrom(to); setTo(from); if (result.value) setInput(result.value); }}><ArrowDownUp aria-hidden="true" /></button>
      <div className="converter-row converter-result"><output aria-label="换算结果" title={result.value}>{result.value || '—'}</output><select aria-label="目标单位" value={to} onChange={(event) => setTo(event.target.value)}>{category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label}</option>)}</select></div>
    </div>
    {result.error && <p className="converter-error" role="status">{result.error}</p>}
  </section>;
}
