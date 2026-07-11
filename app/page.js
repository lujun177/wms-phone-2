'use client';
import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Home() {
  const [logs, setLogs] = useState([]);
  const [sku, setSku] = useState('');
  const [goods, setGoods] = useState(null);
  const [stock, setStock] = useState(0);
  const [qty, setQty] = useState(1);
  const [user, setUser] = useState('');
  const [scanner, setScanner] = useState(null);
  const scannerRef = useRef(null);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    addLog('页面加载成功', 'success');
    addLog('Supabase代理已启用');
  }, []);

  const queryGoods = async (code) => {
    if (!code) return;
    addLog(`查询SKU: ${code}`);
    
    try {
      const res = await fetch(`/api/goods?sku=${code}`);
      const data = await res.json();
      
      if (data.error) {
        addLog(`查询失败: ${data.error}`, 'error');
        setGoods(null);
        return;
      }
      
      if (data.length > 0) {
        setGoods(data[0]);
        addLog(`查询成功: ${data[0].name}`, 'success');
        calcStock(data[0].sku);
      } else {
        setGoods(null);
        addLog('未找到商品', 'error');
      }
    } catch (error) {
      addLog(`查询失败: ${error.message}`, 'error');
      setGoods(null);
    }
  };

  const calcStock = async (sku) => {
    try {
      const res = await fetch(`https://khovpgqqrltmiclwzec.supabase.co/rest/v1/flow?sku=eq.${sku}&select=qty`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k'
        }
      });
      const data = await res.json();
      const total = data.reduce((sum, item) => sum + item.qty, 0);
      setStock(total);
    } catch (e) {
      setStock(0);
    }
  };

  const startScan = () => {
    if (scannerRef.current) return;
    
    const html5QrcodeScanner = new Html5QrcodeScanner('reader', { 
      fps: 10, 
      qrbox: 250 
    });
    
    html5QrcodeScanner.render((decodedText) => {
      setSku(decodedText);
      queryGoods(decodedText);
      html5QrcodeScanner.clear();
      scannerRef.current = null;
    }, () => {});
    
    scannerRef.current = html5QrcodeScanner;
    addLog('扫码库加载成功', 'success');
  };

  const submitFlow = async (type) => {
    if (!goods ||!qty ||!user) {
      addLog('请填写完整信息', 'error');
      return;
    }

    try {
      const res = await fetch('/api/goods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: goods.sku,
          name: goods.name,
          qty: type === '出库'? -qty : qty,
          user: user,
          type: type,
          time: new Date().toISOString()
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        addLog(`${type}成功: ${goods.name} x${qty}`, 'success');
        calcStock(goods.sku);
        setSku('');
        setGoods(null);
        setQty(1);
      } else {
        addLog(`${type}失败: ${data.error}`, 'error');
      }
    } catch (error) {
      addLog(`提交失败: ${error.message}`, 'error');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">WMS扫码出入库</h1>
      
      <div className="space-y-2 mb-4 h-40 overflow-y-auto bg-gray-50 p-2 rounded">
        {logs.map((log, i) => (
          <div key={i} className={`p-2 rounded text-sm ${
            log.type === 'success'? 'bg-green-100 text-green-800' :
            log.type === 'error'? 'bg-red-100 text-red-800' :
            'bg-white'
          }`}>
            {log.time} - {log.msg}
          </div>
        ))}
      </div>

      <div id="reader" className="mb-4"></div>
      <button 
        onClick={startScan}
        className="w-full bg-blue-500 text-white p-3 rounded mb-4 font-bold"
      >
        点击开始扫码
      </button>

      <input
        type="text"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        onBlur={() => queryGoods(sku)}
        placeholder="手动输入SKU或扫码"
        className="w-full border p-2 rounded mb-2"
      />

      {goods && (
        <div className="bg-blue-100 p-3 rounded mb-4">
          <div className="font-bold">商品: {goods.name}</div>
          <div>SKU: {goods.sku}</div>
          <div>当前库存: {stock}</div>
        </div>
      )}

      <input
        type="number"
        value={qty}
        onChange={(e) => setQty(Number(e.target.value))}
        placeholder="数量"
        className="w-full border p-2 rounded mb-2"
      />

      <input
        type="text"
        value={user}
        onChange={(e) => setUser(e.target.value)}
        placeholder="操作人"
        className="w-full border p-2 rounded mb-4"
      />

      <div className="flex gap-2">
        <button 
          onClick={() => submitFlow('入库')}
          className="flex-1 bg-green-500 text-white p-3 rounded font-bold"
        >
          扫码入库
        </button>
        <button 
          onClick={() => submitFlow('出库')}
          className="flex-1 bg-red-500 text-white p-3 rounded font-bold"
        >
          扫码出库
        </button>
      </div>
    </div>
  );
}
