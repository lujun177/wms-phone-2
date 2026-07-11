export default function Page() {
  const html = `
<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>WMS扫码出入库</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js"></script>
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
  .log { background: #f3f4f6; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 12px; white-space: pre-wrap; }
  .error { background: #fee2e2; color: #991b1b; }
  .success { background: #d1fae5; color: #065f46; }
</style>
</head>
<body>
  <div class="card">
    <h2>WMS扫码出入库</h2>
    <div id="log"></div>
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
  const SUPABASE_URL = 'https://khovpgqqrltmiclwzec.supabase.co';
  const KEY = 'sb_publishable_2mJszIG9j1_C5M38SDMHaQ_bW3spbzm';
  
  const log = (msg, type) => {
    const div = document.getElementById('log');
    div.innerHTML += '<div class="log ' + (type || '') + '">' + msg + '</div>';
  };
  
  log('URL: ' + SUPABASE_URL);
  log('KEY: ' + KEY.substring(0, 20) + '...');
  
  let supabase;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, KEY);
    log('Supabase客户端创建成功', 'success');
    log('扫码库加载成功', 'success');
  } catch(e) {
    log('客户端创建失败: ' + e.message, 'error');
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
      log('摄像头启动失败: ' + err, 'error');
    });
  }
  
  window.searchGoods = async function() {
    const code = document.getElementById('code').value.trim();
    const info = document.getElementById('goodsInfo');
    const msg = document.getElementById('msg');
    if (!code) {
      info.innerHTML = '';
      currentGoods = null;
      return;
    }
    
    log('查询SKU: ' + code);
    
    let { data: goods, error: err1 } = await supabase.from('goods').select('*').or('sku.eq.' + code + ',barcode.eq.' + code).single();
    
    if (err1) {
      log('查goods表失败: ' + err1.message + ' Code: ' + err1.code, 'error');
      msg.innerHTML = '<div class="error">查询错误: ' + err1.message + '</div>';
      return;
    }
    
    if (!goods) {
      currentGoods = null;
      info.innerHTML = '<div class="info" style="color:red">未找到该货品</div>';
      log('未找到货品', 'error');
      return;
    }
    
    let { data: flows, error: err2 } = await supabase.from('flow').select('qty').eq('sku', goods.sku);
    
    if (err2) {
      log('查flow表失败: ' + err2.message, 'error');
      msg.innerHTML = '<div class="error">查询库存失败: ' + err2.message + '</div>';
      return;
    }
    
    let current_stock = 0;
    if (flows) {
      current_stock = flows.reduce((sum, f) => sum + (f.qty || 0), 0);
    }
    
    let status = '正常';
    if (current_stock <= 0) status = '缺货';
    else if (current_stock < goods.safe_stock) status = '低于安全库存';
    
    currentGoods = {
      sku: goods.sku,
      name: goods.name,
      location: goods.location,
      safe_stock: goods.safe_stock,
      current_stock: current_stock,
      status: status
    };
    
    log('查询成功: ' + goods.name, 'success');
    info.innerHTML = '<div class="info">' +
      '<div><b>' + goods.name + '</b> [' + goods.sku + ']</div>' +
      '<div>库位: ' + (goods.location || '无') + '</div>' +
      '<div>当前库存: <span class="stock">' + current_stock + '</span></div>' +
      '<div>安全库存: ' + goods.safe_stock + '</div>' +
      '<div>状态: <span class="status-' + status + '">' + status + '</span></div>' +
      '</div>';
  }

  window.submit = async function(type) {
    const qty = parseInt(document.getElementById('qty').value);
    const operator = document.getElementById('operator').value || '手机端';
    const msg = document.getElementById('msg');
    
    if (!currentGoods) {
      msg.innerHTML = '<p style="color:red">请先输入SKU识别货品</p>';
      return;
    }
    if (!qty || qty <= 0) {
      msg.innerHTML = '<p style="color:red">请输入正确数量</p>';
      return;
    }
    
    const { error } = await supabase.from('flow').insert([{
      type: type,
      sku: currentGoods.sku,
      name: currentGoods.name,
      qty: type === '入库' ? qty : -qty,
      operator: operator
    }]);
    
    if (error) {
      log('提交失败: ' + error.message, 'error');
      msg.innerHTML = '<p style="color:red">失败: ' + error.message + '</p>';
    } else {
      log(type + '成功: ' + currentGoods.name + ' x' + qty, 'success');
      msg.innerHTML = '<p style="color:green">' + type + '成功: ' + currentGoods.name + ' x' + qty + '</p>';
      document.getElementById('code').value = '';
      document.getElementById('qty').value = '1';
      document.getElementById('goodsInfo').innerHTML = '';
      currentGoods = null;
    }
  }
</script>
</body>
</html>
  `;

  return (
    <iframe 
      srcDoc={html} 
      style={{width: '100%', height: '100vh', border: 'none'}}
      allow="camera; microphone"
    />
  )
}
