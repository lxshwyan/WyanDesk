export interface ConversionUnit { id: string; label: string; factor: number; offset?: number }
export const conversionCategories = [
  { id: 'length', label: '长度', units: [{ id: 'm', label: '米 m', factor: 1 }, { id: 'km', label: '千米 km', factor: 1000 }, { id: 'cm', label: '厘米 cm', factor: .01 }, { id: 'mm', label: '毫米 mm', factor: .001 }, { id: 'in', label: '英寸 in', factor: .0254 }, { id: 'ft', label: '英尺 ft', factor: .3048 }, { id: 'mi', label: '英里 mi', factor: 1609.344 }] },
  { id: 'mass', label: '质量', units: [{ id: 'kg', label: '千克 kg', factor: 1 }, { id: 'g', label: '克 g', factor: .001 }, { id: 't', label: '吨 t', factor: 1000 }, { id: 'lb', label: '磅 lb', factor: .45359237 }, { id: 'oz', label: '盎司 oz', factor: .028349523125 }] },
  { id: 'temperature', label: '温度', units: [{ id: 'C', label: '摄氏度 °C', factor: 1, offset: 273.15 }, { id: 'F', label: '华氏度 °F', factor: 5 / 9, offset: 459.67 }, { id: 'K', label: '开尔文 K', factor: 1 }] },
  { id: 'area', label: '面积', units: [{ id: 'm2', label: '平方米 m²', factor: 1 }, { id: 'km2', label: '平方千米 km²', factor: 1e6 }, { id: 'ha', label: '公顷 ha', factor: 1e4 }, { id: 'mu', label: '市亩', factor: 2000 / 3 }, { id: 'ft2', label: '平方英尺 ft²', factor: .09290304 }] },
  { id: 'volume', label: '体积', units: [{ id: 'L', label: '升 L', factor: 1 }, { id: 'mL', label: '毫升 mL', factor: .001 }, { id: 'm3', label: '立方米 m³', factor: 1000 }, { id: 'galUS', label: '美制加仑', factor: 3.785411784 }, { id: 'galUK', label: '英制加仑', factor: 4.54609 }] },
  { id: 'speed', label: '速度', units: [{ id: 'kmh', label: '千米/时 km/h', factor: 1 / 3.6 }, { id: 'ms', label: '米/秒 m/s', factor: 1 }, { id: 'mph', label: '英里/时 mph', factor: .44704 }, { id: 'kn', label: '节 kn', factor: 1852 / 3600 }] },
  { id: 'data', label: '数据', units: [{ id: 'MB', label: '兆字节 MB', factor: 1e6 }, { id: 'GB', label: '吉字节 GB', factor: 1e9 }, { id: 'MiB', label: '兆二进制字节 MiB', factor: 1048576 }, { id: 'GiB', label: '吉二进制字节 GiB', factor: 1073741824 }, { id: 'B', label: '字节 B', factor: 1 }, { id: 'bit', label: '比特 bit', factor: .125 }] },
  { id: 'time', label: '时间', units: [{ id: 'min', label: '分钟 min', factor: 60 }, { id: 'h', label: '小时 h', factor: 3600 }, { id: 's', label: '秒 s', factor: 1 }, { id: 'day', label: '天 d', factor: 86400 }, { id: 'ms', label: '毫秒 ms', factor: .001 }] },
] satisfies Array<{ id: string; label: string; units: ConversionUnit[] }>;

export function convertUnit(input: string, categoryId: string, fromId: string, toId: string): { value?: string; error?: string } {
  const trimmed = input.trim();
  if (!trimmed) return {};
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return { error: '请输入有效数字' };
  const value = Number(trimmed);
  const category = conversionCategories.find((item) => item.id === categoryId);
  const from: ConversionUnit | undefined = category?.units.find((item) => item.id === fromId);
  const to: ConversionUnit | undefined = category?.units.find((item) => item.id === toId);
  if (!Number.isFinite(value) || !from || !to) return { error: '数值超出范围' };
  const base = (value + (from.offset || 0)) * from.factor;
  if (categoryId === 'temperature' && base < -1e-10) return { error: '温度不能低于绝对零度' };
  const rawResult = base / to.factor - (to.offset || 0);
  const result = categoryId === 'temperature' && Math.abs(rawResult) < 1e-10 ? 0 : rawResult;
  if (!Number.isFinite(result)) return { error: '结果超出范围' };
  return { value: String(Number(result.toPrecision(12))) };
}
