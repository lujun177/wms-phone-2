export default function Page() {
  const SUPABASE_URL = 'https://khovpgqqrltmiclwzec.supabase.co'; 
  const SUPABASE_KEY = 'sb_publishable_Yi8oMb6B-2G1S4gFNXe8BA_lbqlACKJkhovpgqqriltmiclwzec'; // 用你完整的

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
          .error { padding: 12px; background: #fee2e2; color: #b91c1c; border-radius: 8px; margin: 8px 0; }
        </style>
        </head>
        <body>
          <div class="card">
            <h2>WMS扫码出入库</h2>
            <div id="debug"></div>
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
          const debug = document.getElementById('debug');
          debug.innerHTML = '<div class="info">正在连接数据库...</div>';
          
          let supabase;
          try {
            supabase = window.supabase.createClient('${SUPABASE_URL}', '${SUPABASE_KEY}');
            debug.innerHTML = '<div class="info" style="color:green">数据库连接成功</div>';
          } catch(e) {
            debug.innerHTML = '<div class="error">连接失败: ' + e.message + '</div>';
          }
          
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
            const msg = document.getElementById('msg');
            if (!code) {
              info.innerHTML = '';
              window.currentGoods = null;
              return;
            }
            
            msg.innerHTML = '<p style="color:blue">查询中...</p>';
            let { data, error } = await supabase.from('stock_view').select('*').eq('sku', code).single();
            
            if (error) {
              msg.innerHTML = '<div class="error">查询错误: ' + error.message + '</div>';
              console.log(error);
              return;
            }
            
            if (!data) {
              let res = await
