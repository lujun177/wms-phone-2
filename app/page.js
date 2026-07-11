export default function Page() {
  // ↓↓ 把第一行换成你的Project URL ↓↓↓
  const SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co'; 
  const SUPABASE_KEY = 'sb_publishable_Yi8oMb6B-2G1S4gFNXe8BA_lbqlACKJkhovpgqqriltmiclwzec';

  return (
    <iframe 
      srcDoc={`
        <!DOCTYPE html>
        <html lang="zh">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WMS扫码出入库</title>
        <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
        <script src="https://unpkg.com/html5-qrcode"></script>
        <style>
          body { font-family: -apple-system, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          button { width: 100%; padding: 16px; font-size: 18px; border: none; border-radius: 8px; margin: 8px 0; font-weight: 600; }
          .in { background: #10b981; color: white; }
          .out { background: #ef4444; color: white; }
          .scan { background: #3b82f6; color: white; }
          #reader { width: 100%; margin: 12px 0; }
          input { width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px; margin: 8px 0; box-sizing: border-box; }
          .info { padding: 12px; background: #f0f9ff; border-radius: 8px; margin: 8px 0; }
          .stock { font-size: 24px; font-weight: bold; color: #1e40af; }
          .status-正常 { color: #10b981; }
          .status-低于安全库存 { color: #f59e0b; }
          .status-缺货 { color: #ef4444; }
        </style>
        </head>
        <body>
          <div class="card">
            <h2>WMS扫码出入库</h2>
            <button class="scan" onclick="startScan()">点击开始扫码</button>
            <div id="reader"></div>
            <input id="code" placeholder="扫码或输入SKU/条码" oninput="searchGoods()" />
            <div id="goodsInfo"></div>
            <input id="qty" type="number" placeholder="数量" value="1" />
            <input id="operator" placeholder="操作人" />
            <button class="in" onclick="submit('入库')">扫码入库</button>
            <button class="out" onclick="submit('出库')">扫码出库</button>
            <div id="msg"></div>
          </div>
        
        <script>
          const supabase = window.supabase.createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');
          
          let currentGoods = null;
          let html5QrcodeScanner = null;
          
          window.startScan = async function() {
            document.getElementById('msg').innerHTML = '';
            if (html5QrcodeScanner) {
              try { await html5QrcodeScanner.clear(); } catch(e) {}
            }
            html5QrcodeScanner = new Html5Qrcode("reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrcodeScanner.start(
              { facingMode: "environment" }, 
              config,
              (decodedText) => {
                document.getElementById('code').value = decodedText;
                window.searchGoods();
                html5QrcodeScanner.stop();
                document.getElementById('reader').innerHTML = '';
              },
              (error) => {}
            ).catch(err => {
              document.getElementById('msg').innerHTML = '<p style="color:red">摄像头启动失败：' + err + '</p>';
            });
          }
          
          window.searchGoods = async function() {
            const code = document.getElementById('code').value.trim();
            const info = document.getElementById('goodsInfo');
            if (!code) {
              info.innerHTML = '';
              window.currentGoods = null;
              return;
            }
            
            let { data, error } = await supabase.from('stock_view').select('*').eq('sku', code).single();
            if (!data) {
              let res = await supabase.from('goods').select('sku').eq('barcode', code).single();
              if (res.data) {
                let res2 = await supabase.from('stock_view').select('*').eq('sku', res.data.sku).single();
                data = res2.data;
              }
            }
            
            if (data) {
              window.currentGoods = data;
              info.innerHTML = \`
                <div class="info">
                  <div><b>\${data.name}</b> [\${data.sku}]</div>
                  <div>库位: \${data.location || '无'}</div>
                  <div>当前库存: <span class="stock">\${data.current_stock}</span></div>
                  <div>安全库存: \${data.safe_stock}</div>
                  <div>状态: <span class="status-\${data.status}">\${data.status}</span></div>
                </div>
              \`;
            } else {
              window.currentGoods = null;
              info.innerHTML = '<div class="info" style="color:red">未找到该货品</div>';
            }
          }
        
          window.submit = async function(type) {
            const qty = parseInt(document.getElementById('qty').value);
            const operator = document.getElementById('operator').value || '手机端';
            const msg = document.getElementById('msg');
            
            if (!window.currentGoods) {
              msg.innerHTML = '<p style="color:red">请先输入SKU识别货品</p>';
              return;
            }
            if (!qty || qty <= 0) {
              msg.innerHTML = '<p style="color:red">请输入正确数量</p>';
              return;
            }
            
            const { error } = await supabase.from('flow').insert([{
              type: type,
              sku: window.currentGoods.sku,
              name: window.currentGoods.name,
              qty: type === '入库' ? qty : -qty,
              operator: operator
            }]);
            
            if (error) {
              msg.innerHTML = '<p style="color:red">失败: ' + error.message + '</p>';
            } else {
              msg.innerHTML = '<p style="color:green">' + type + '成功: ' + window.currentGoods.name + ' x' + qty + '</p>';
              document.getElementById('code').value = '';
              document.getElementById('qty').value = '1';
              document.getElementById('goodsInfo').innerHTML = '';
              window.currentGoods = null;
            }
          }
        </script>
        </body>
        </html>
      `} 
      style={{width: '100%', height: '100vh', border: 'none'}}
    />
  )
}
