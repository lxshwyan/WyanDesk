import { Calculator } from 'lucide-react';
import { useState } from 'react';

type CalculatorOperator = '+' | '−' | '×' | '÷';

export function calculateValues(left: number, right: number, operator: CalculatorOperator): number {
  if (operator === '+') return left + right;
  if (operator === '−') return left - right;
  if (operator === '×') return left * right;
  return right === 0 ? Number.NaN : left / right;
}

function formatValue(value: number): string {
  if (!Number.isFinite(value)) return '错误';
  return Number(value.toPrecision(10)).toString().slice(0, 12);
}

export function CalculatorCard() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<CalculatorOperator | null>(null);
  const [awaitingOperand, setAwaitingOperand] = useState(false);

  function inputDigit(digit: string) {
    setDisplay((current) => awaitingOperand || current === '0' || current === '错误' ? digit : `${current}${digit}`.slice(0, 12));
    setAwaitingOperand(false);
  }

  function inputDecimal() {
    setDisplay((current) => {
      if (awaitingOperand || current === '错误') return '0.';
      return current.includes('.') ? current : `${current}.`;
    });
    setAwaitingOperand(false);
  }

  function clear() {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setAwaitingOperand(false);
  }

  function chooseOperator(nextOperator: CalculatorOperator) {
    const currentValue = Number(display);
    if (!Number.isFinite(currentValue)) return clear();
    if (storedValue !== null && operator && !awaitingOperand) {
      const result = calculateValues(storedValue, currentValue, operator);
      setDisplay(formatValue(result));
      setStoredValue(result);
    } else {
      setStoredValue(currentValue);
    }
    setOperator(nextOperator);
    setAwaitingOperand(true);
  }

  function equals() {
    if (storedValue === null || !operator) return;
    const result = calculateValues(storedValue, Number(display), operator);
    setDisplay(formatValue(result));
    setStoredValue(null);
    setOperator(null);
    setAwaitingOperand(true);
  }

  function toggleSign() {
    if (display === '0' || display === '错误') return;
    setDisplay((current) => current.startsWith('-') ? current.slice(1) : `-${current}`);
  }

  function percent() {
    if (display === '错误') return;
    setDisplay(formatValue(Number(display) / 100));
  }

  return (
    <section className="glass-panel calculator-card">
      <div className="mini-heading"><span><Calculator aria-hidden="true" />快速计算</span><small>本地计算</small></div>
      <output className="calculator-display" aria-live="polite">{display}</output>
      <div className="calculator-grid" aria-label="计算器">
        <button type="button" className="utility" onClick={clear}>C</button>
        <button type="button" className="utility" onClick={toggleSign}>±</button>
        <button type="button" className="utility" onClick={percent}>%</button>
        <button type="button" className={operator === '÷' ? 'operator active' : 'operator'} onClick={() => chooseOperator('÷')}>÷</button>
        {['7', '8', '9'].map((digit) => <button type="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button type="button" className={operator === '×' ? 'operator active' : 'operator'} onClick={() => chooseOperator('×')}>×</button>
        {['4', '5', '6'].map((digit) => <button type="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button type="button" className={operator === '−' ? 'operator active' : 'operator'} onClick={() => chooseOperator('−')}>−</button>
        {['1', '2', '3'].map((digit) => <button type="button" key={digit} onClick={() => inputDigit(digit)}>{digit}</button>)}
        <button type="button" className={operator === '+' ? 'operator active' : 'operator'} onClick={() => chooseOperator('+')}>+</button>
        <button type="button" className="zero" onClick={() => inputDigit('0')}>0</button>
        <button type="button" onClick={inputDecimal}>.</button>
        <button type="button" className="equals" onClick={equals}>=</button>
      </div>
    </section>
  );
}
