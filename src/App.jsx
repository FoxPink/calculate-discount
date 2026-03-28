import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('calc_history')
    return saved ? JSON.parse(saved) : []
  })
  const [lastSaved, setLastSaved] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '' })
  const [showCalculator, setShowCalculator] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  
  // Manual input
  const [qty, setQty] = useState('')
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')

  // Main calculator logic
  const mainCalcResult = (() => {
    const q = parseFloat(qty.replace(/[^\d.,]/g, '').replace(',', '.'))
    const p = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
    const d = parseFloat(discount.replace(/[^\d.,]/g, '').replace(',', '.'))
    
    if (!isNaN(q) && !isNaN(p) && !isNaN(d) && (q * p) !== 0) {
      return ((d / (q * p)) * 100).toFixed(2)
    }
    return ''
  })()

  const [calc1Input1, setCalc1Input1] = useState('')
  const [calc1Input2, setCalc1Input2] = useState('')
  const [calc1Result, setCalc1Result] = useState('')
  
  const [calc2Input1, setCalc2Input1] = useState('')
  const [calc2Input2, setCalc2Input2] = useState('')
  const [calc2Result, setCalc2Result] = useState('')
  
  const [calc3Input1, setCalc3Input1] = useState('')
  const [calc3Input2, setCalc3Input2] = useState('')
  const [calc3Result, setCalc3Result] = useState('')
  
  const [calc4Input1, setCalc4Input1] = useState('')
  const [calc4Mode, setCalc4Mode] = useState('tăng')
  const [calc4Input2, setCalc4Input2] = useState('')
  const [calc4Result, setCalc4Result] = useState('')
  
  const [calc5Input1, setCalc5Input1] = useState('')
  const [calc5Input2, setCalc5Input2] = useState('')
  const [calc5Result, setCalc5Result] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Tự động lưu lịch sử khi có kết quả hợp lệ
  useEffect(() => {
    if (mainCalcResult && mainCalcResult !== '0.00' && mainCalcResult !== 'Infinity') {
      const q = parseFloat(qty.replace(/[^\d.,]/g, '').replace(',', '.'))
      const p = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
      const d = parseFloat(discount.replace(/[^\d.,]/g, '').replace(',', '.'))
      
      const currentEntry = JSON.stringify({ q, p, d })
      if (lastSaved !== currentEntry) {
        const newEntry = {
          qty: q,
          price: p,
          discountAmount: d,
          discountPercent: Number(mainCalcResult),
          timestamp: new Date().toLocaleString('vi-VN')
        }
        setHistory(prev => {
          const updated = [newEntry, ...prev]
          return updated.slice(0, 30)
        })
        setLastSaved(currentEntry)
      }
    }
  }, [mainCalcResult, qty, price, discount])

  useEffect(() => {
    localStorage.setItem('calc_history', JSON.stringify(history))
  }, [history])

  const handleSaveToHistory = () => {
    if (mainCalcResult) {
      const q = parseFloat(qty.replace(/[^\d.,]/g, '').replace(',', '.'))
      const p = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'))
      const d = parseFloat(discount.replace(/[^\d.,]/g, '').replace(',', '.'))
      
      const newEntry = {
        qty: q,
        price: p,
        discountAmount: d,
        discountPercent: Number(mainCalcResult),
        timestamp: new Date().toLocaleString('vi-VN')
      }
      
      setHistory([newEntry, ...history])
      setToast({ show: true, message: 'Đã lưu vào lịch sử!' })
      setTimeout(() => setToast({ show: false, message: '' }), 2000)
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử?')) {
      setHistory([])
    }
  }

  const clearCalculator = () => {
    setCalc1Input1('')
    setCalc1Input2('')
    setCalc1Result('')
    setCalc2Input1('')
    setCalc2Input2('')
    setCalc2Result('')
    setCalc3Input1('')
    setCalc3Input2('')
    setCalc3Result('')
    setCalc4Input1('')
    setCalc4Input2('')
    setCalc4Result('')
    setCalc5Input1('')
    setCalc5Input2('')
    setCalc5Result('')
    setDropdownOpen(false)
  }

  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY

  const parseTableWithGemini = async (imageFile) => {
    try {
      // Convert image to base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(imageFile)
      })
      const base64Image = await base64Promise

      // Call Gemini Vision API with v1beta endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  text: `Phân tích bảng trong ảnh này:
1. BỎ QUA dòng tiêu đề (header) có chữ "Số lượng", "Đơn giá", "Tổng tiền CK"
2. CHỈ lấy các dòng dữ liệu sản phẩm (có STT 1, 2, 3, 4, 5...)
3. Với mỗi dòng sản phẩm, trích xuất:
   - qty: Giá trị ở cột "Số lượng" (cột 6)
   - price: Giá trị ở cột "Đơn giá" (cột 7) 
   - discount: Giá trị ở cột "Tổng tiền CK" (cột 8)

Trả về JSON array format: [{"qty": number, "price": number, "discount": number}]

CHỈ trả về JSON, KHÔNG giải thích gì thêm.`
                },
                {
                  inline_data: {
                    mime_type: imageFile.type,
                    data: base64Image
                  }
                }
              ]
            }]
          })
        }
      )

      const result = await response.json()
      console.log('Gemini Response:', result)
      
      // Check for errors
      if (result.error) {
        console.error('Gemini API Error:', result.error)
        throw new Error(result.error.message || 'API Error')
      }
      
      if (result.candidates && result.candidates[0]) {
        const text = result.candidates[0].content.parts[0].text
        return parseGeminiResponse(text)
      }
      
      return []
    } catch (error) {
      console.error('Gemini Error:', error)
      throw error
    }
  }

  const parseGeminiResponse = (text) => {
    console.log("=== GEMINI TEXT ===")
    console.log(text)
    console.log("===================")
    
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0])
        
        return data.map((item) => {
          const base = item.qty * item.price
          const discountPercent = (item.discount / base) * 100
          return {
            qty: item.qty,
            price: item.price,
            discountAmount: item.discount,
            discountPercent: Number(discountPercent.toFixed(2))
          }
        })
      }
    } catch (e) {
      console.error('Parse error:', e)
    }
    
    return []
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImage(URL.createObjectURL(file))
    setLoading(true)
    setResults([])

    try {
      const parsed = await parseTableWithGemini(file)
      
      if (parsed.length === 0) {
        alert('Không đọc được dữ liệu.\n\nAPI key có thể chưa được kích hoạt.\nVui lòng:\n1. Vào https://aistudio.google.com/app/apikey\n2. Tạo API key mới\n3. Thay vào dòng 17 trong App.jsx\n\nHoặc dùng chế độ "Nhập thêm" để nhập thủ công!')
      } else {
        setResults(parsed)
      }
    } catch (error) {
      console.error('OCR Error:', error)
      alert(`Lỗi: ${error.message}\n\nVui lòng kiểm tra:\n1. API key có đúng không?\n2. API key đã được kích hoạt chưa?\n3. Thử tạo key mới tại: https://aistudio.google.com/app/apikey`)
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile()
        if (file) {
          setImage(URL.createObjectURL(file))
          setLoading(true)
          setResults([])

          try {
            const parsed = await parseTableWithGemini(file)
            
            if (parsed.length === 0) {
              alert('Không đọc được dữ liệu từ ảnh!')
            } else {
              setResults(parsed)
            }
          } catch (error) {
            console.error('OCR Error:', error)
            alert(`Lỗi: ${error.message}`)
          } finally {
            setLoading(false)
          }
        }
        break
      }
    }
  }

  const handleImageClick = () => {
    document.getElementById('file-input').click()
  }

  const handleDeleteImage = (e) => {
    e.stopPropagation()
    setImage(null)
  }

  const handleManualCalculate = () => {
    const q = Number(qty.replace(/[.,]/g, ''))
    const p = Number(price.replace(/[.,]/g, ''))
    const d = Number(discount.replace(/[.,]/g, ''))
    
    if (!q || !p || !d) {
      alert('Vui lòng nhập đầy đủ thông tin!')
      return
    }
    
    const base = q * p
    const discountPercent = (d / base) * 100
    
    const newResult = {
      qty: q,
      price: p,
      discountAmount: d,
      discountPercent: Number(discountPercent.toFixed(2))
    }
    
    setResults([...results, newResult])
    setQty('')
    setPrice('')
    setDiscount('')
  }

  const handleClearAll = () => {
    setResults([])
    setQty('')
    setPrice('')
    setDiscount('')
  }

  const handleCellEdit = (index, field, value) => {
    const newResults = [...results]
    const numValue = Number(value.replace(/[.,]/g, ''))
    
    newResults[index][field] = numValue
    
    // Recalculate discount percent
    const base = newResults[index].qty * newResults[index].price
    newResults[index].discountPercent = Number(((newResults[index].discountAmount / base) * 100).toFixed(2))
    
    setResults(newResults)
  }

  const handleCopyPercent = (percent) => {
    navigator.clipboard.writeText(percent.toFixed(2))
    setToast({ show: true, message: `Đã copy: ${percent.toFixed(2)}%` })
    setTimeout(() => setToast({ show: false, message: '' }), 2000)
  }

  // Quick calculator functions
  const calculateCalc1 = (v1 = calc1Input1, v2 = calc1Input2) => {
    const s1 = v1.replace(/[^\d.,]/g, '').replace(',', '.')
    const s2 = v2.replace(/[^\d.,]/g, '').replace(',', '.')
    const val1 = parseFloat(s1)
    const val2 = parseFloat(s2)
    if (!isNaN(val1) && !isNaN(val2)) {
      setCalc1Result(((val1 / 100) * val2).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
    } else {
      setCalc1Result('')
    }
  }

  const calculateCalc2 = (v1 = calc2Input1, v2 = calc2Input2) => {
    const s1 = v1.replace(/[^\d.,]/g, '').replace(',', '.')
    const s2 = v2.replace(/[^\d.,]/g, '').replace(',', '.')
    const val1 = parseFloat(s1)
    const val2 = parseFloat(s2)
    if (!isNaN(val1) && !isNaN(val2) && val2 !== 0) {
      setCalc2Result(((val1 / val2) * 100).toFixed(2))
    } else {
      setCalc2Result('')
    }
  }

  const calculateCalc3 = (v1 = calc3Input1, v2 = calc3Input2) => {
    const s1 = v1.replace(/[^\d.,]/g, '').replace(',', '.')
    const s2 = v2.replace(/[^\d.,]/g, '').replace(',', '.')
    const val1 = parseFloat(s1)
    const val2 = parseFloat(s2)
    if (!isNaN(val1) && !isNaN(val2) && val1 !== 0) {
      // Logic: Tính tỷ lệ thay đổi từ giá trị 1 (val1) đến giá trị 2 (val2)
      // Công thức: ((Mới - Cũ) / Cũ) * 100
      const result = ((val2 - val1) / val1) * 100
      setCalc3Result(result.toFixed(2))
    } else {
      setCalc3Result('')
    }
  }

  const calculateCalc4 = (v1 = calc4Input1, v2 = calc4Input2, mode = calc4Mode) => {
    const s1 = v1.replace(/[^\d.,]/g, '').replace(',', '.')
    const s2 = v2.replace(/[^\d.,]/g, '').replace(',', '.')
    const val1 = parseFloat(s1)
    const val2 = parseFloat(s2)
    if (!isNaN(val1) && !isNaN(val2)) {
      const multiplier = mode === 'tăng' ? (1 + val1 / 100) : (1 - val1 / 100)
      setCalc4Result((val2 * multiplier).toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
    } else {
      setCalc4Result('')
    }
  }

  const calculateCalc5 = (v1 = calc5Input1, v2 = calc5Input2) => {
    const s1 = v1.replace(/[^\d.,]/g, '').replace(',', '.')
    const s2 = v2.replace(/[^\d.,]/g, '').replace(',', '.')
    
    const val1 = parseFloat(s1)
    const val2 = parseFloat(s2)
    
    if (!isNaN(val1) && !isNaN(val2) && val2 !== 0) {
      // Logic: Z = (X * 100) / Y
      const result = (val1 * 100) / val2
      setCalc5Result(result.toLocaleString('vi-VN', { maximumFractionDigits: 2 }))
    } else {
      setCalc5Result('')
    }
  }

  const handleCopyCalcResult = (value) => {
    if (value) {
      navigator.clipboard.writeText(value)
      setToast({ show: true, message: `Đã copy: ${value}` })
      setTimeout(() => setToast({ show: false, message: '' }), 2000)
    }
  }

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`} onPaste={handlePaste}>
      {toast.show && (
        <div className="toast">
          {toast.message}
        </div>
      )}
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="logo-text">Calculate Discount</span>
        </div>
        <div className="navbar-actions">
          
          <button className="nav-btn" onClick={() => setShowGuide(true)}>
            Hướng dẫn
          </button>
          <button className="nav-btn calculator-btn" onClick={() => setShowCalculator(true)}>
            Tính phần trăm
          </button>
        </div>
      </nav>

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Lịch sử tính toán</h2>
              <button className="close-btn" onClick={() => setShowHistory(false)}>×</button>
            </div>
            <div className="modal-body">
              {history.length > 0 ? (
                <>
                  <div className="history-body-header">
                    <button className="clear-btn" onClick={handleClearHistory}>
                      Xóa tất cả lịch sử
                    </button>
                  </div>
                  <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Thời gian</th>
                        <th>Số lượng</th>
                        <th>Đơn giá</th>
                        <th>Tiền CK</th>
                        <th>% CK</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => (
                        <tr key={index}>
                          <td>{history.length - index}</td>
                          <td className="time-cell">{item.timestamp}</td>
                          <td>{item.qty?.toLocaleString('vi-VN')}</td>
                          <td>{item.price?.toLocaleString('vi-VN')}</td>
                          <td>{item.discountAmount?.toLocaleString('vi-VN')}</td>
                          <td 
                            className="discount-percent clickable"
                            onClick={() => handleCopyPercent(item.discountPercent)}
                            title="Nhấn để sao chép"
                          >
                            {Number(item.discountPercent).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
              ) : (
                <div className="empty-history">
                  <p>Chưa có lịch sử tính toán nào.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="modal-overlay" onClick={() => setShowGuide(false)}>
          <div className="modal-content guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Hướng dẫn sử dụng</h2>
              <button className="close-btn" onClick={() => setShowGuide(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="guide-section">
                <h3>1. Đọc ảnh hóa đơn</h3>
                <p>• Click vào vùng ảnh bên trái hoặc nhấn Ctrl+V để paste ảnh</p>
                <p>• AI sẽ tự động đọc dữ liệu từ các cột <b>6, 7 và 8</b> của bảng (Số lượng, Đơn giá, Tiền CK)</p>
                <p>• Đảm bảo ảnh chụp rõ nét, bao gồm cả tiêu đề cột và ít nhất một dòng dữ liệu</p>
                <p>• Kết quả hiển thị bên phải với % chiết khấu đã tính</p>
              </div>
              <div className="guide-section">
                <h3>2. Nhập thủ công</h3>
                <p>• Điền SL, Đơn giá, Tiền CK vào form bên phải</p>
                <p>• Nhấn "Thêm" để thêm vào bảng kết quả</p>
              </div>
              <div className="guide-section">
                <h3>3. Chỉnh sửa kết quả</h3>
                <p>• Click vào các ô trong bảng để chỉnh sửa</p>
                <p>• % CK sẽ tự động tính lại khi bạn thay đổi giá trị</p>
                <p>• Click vào cột % để copy giá trị</p>
              </div>
              <div className="guide-section">
                <h3>4. Tính toán nhanh</h3>
                <p>• Nhấn nút "Tính toán nhanh" trên navbar</p>
                <p>• Sử dụng các công cụ tính % nhanh</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Calculator Modal */}
      {showCalculator && (
        <div className="modal-overlay" onClick={() => {
          setShowCalculator(false)
          clearCalculator()
        }}>
          <div className="modal-content calculator-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tính toán nhanh</h2>
              <button className="close-btn" onClick={() => {
                setShowCalculator(false)
                clearCalculator()
              }}>×</button>
            </div>
            <div className="modal-body">
              {/* Calculator 1 */}
              <div className="calc-box">
                <p className="calc-title">Tính phần trăm của một giá trị.</p>
                <div className="calc-row">
                  <div className="input-with-symbol">
                    <input 
                      type="text" 
                      value={calc1Input1}
                      onChange={(e) => {
                        const val = e.target.value
                        setCalc1Input1(val)
                        calculateCalc1(val, calc1Input2)
                      }}
                      placeholder="0"
                    />
                    <span className="input-symbol">%</span>
                  </div>
                  <span>của</span>
                  <input 
                    type="text" 
                    value={calc1Input2}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc1Input2(val)
                      calculateCalc1(calc1Input1, val)
                    }}
                    placeholder="0"
                  />
                  <span>?</span>
                  <div className="calc-spacer"></div>
                  <span>=</span>
                  <input 
                    type="text" 
                    value={calc1Result}
                    readOnly
                    className="result-input"
                    onClick={() => handleCopyCalcResult(calc1Result)}
                    title="Nhấn để sao chép"
                  />
                </div>
              </div>

              {/* Calculator 2 */}
              <div className="calc-box">
                <p className="calc-title">Làm thế nào để tính toán tỷ lệ phần trăm một số là của một số khác.</p>
                <div className="calc-row">
                  <input 
                    type="text" 
                    value={calc2Input1}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc2Input1(val)
                      calculateCalc2(val, calc2Input2)
                    }}
                    placeholder="0"
                  />
                  <span>là bao nhiêu % của</span>
                  <input 
                    type="text" 
                    value={calc2Input2}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc2Input2(val)
                      calculateCalc2(calc2Input1, val)
                    }}
                    placeholder="0"
                  />
                  <span>?</span>
                  <div className="calc-spacer"></div>
                  <span>=</span>
                  <div className="input-with-symbol result-wrapper">
                    <input 
                      type="text" 
                      value={calc2Result}
                      readOnly
                      className="result-input"
                      onClick={() => handleCopyCalcResult(calc2Result)}
                      title="Nhấn để sao chép"
                    />
                    <span className="input-symbol">%</span>
                  </div>
                </div>
              </div>

              {/* Calculator 3 */}
              <div className="calc-box">
                <p className="calc-title">Tính tỷ lệ thay đổi phần trăm giữa hai giá trị</p>
                <div className="calc-row">
                  <span>Thay đổi từ</span>
                  <input 
                    type="text" 
                    value={calc3Input1}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc3Input1(val)
                      calculateCalc3(val, calc3Input2)
                    }}
                    placeholder="0"
                  />
                  <span>đến</span>
                  <input 
                    type="text" 
                    value={calc3Input2}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc3Input2(val)
                      calculateCalc3(calc3Input1, val)
                    }}
                    placeholder="0"
                  />
                  <span>?</span>
                  <div className="calc-spacer"></div>
                  <span>=</span>
                  <div className="input-with-symbol result-wrapper">
                    <input 
                      type="text" 
                      value={calc3Result}
                      readOnly
                      className="result-input"
                      onClick={() => handleCopyCalcResult(calc3Result)}
                      title="Nhấn để sao chép"
                    />
                    <span className="input-symbol">%</span>
                  </div>
                </div>
              </div>

              {/* Calculator 4 */}
              <div className={`calc-box ${dropdownOpen ? 'open' : ''}`}>
                <p className="calc-title">Để tăng hoặc giảm một tỷ lệ cụ thể.</p>
                <div className="calc-row">
                  <div className="input-with-symbol">
                    <input 
                      type="text" 
                      value={calc4Input1}
                      onChange={(e) => {
                        const val = e.target.value
                        setCalc4Input1(val)
                        calculateCalc4(val, calc4Input2, calc4Mode)
                      }}
                      placeholder="0"
                    />
                    <span className="input-symbol">%</span>
                  </div>
                  <div className={`custom-dropdown ${dropdownOpen ? 'open' : ''}`}>
                    <div 
                      className="dropdown-selected" 
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                      {calc4Mode}
                    </div>
                    {dropdownOpen && (
                      <div className="dropdown-options">
                        <div 
                          className="dropdown-option" 
                          onClick={() => {
                            setCalc4Mode('tăng')
                            setDropdownOpen(false)
                            calculateCalc4(calc4Input1, calc4Input2, 'tăng')
                          }}
                        >
                          tăng
                        </div>
                        <div 
                          className="dropdown-option" 
                          onClick={() => {
                            setCalc4Mode('giảm')
                            setDropdownOpen(false)
                            calculateCalc4(calc4Input1, calc4Input2, 'giảm')
                          }}
                        >
                          giảm
                        </div>
                      </div>
                    )}
                  </div>
                  <span>của</span>
                  <input 
                    type="text" 
                    value={calc4Input2}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc4Input2(val)
                      calculateCalc4(calc4Input1, val, calc4Mode)
                    }}
                    placeholder="0"
                  />
                  <span>?</span>
                  <div className="calc-spacer"></div>
                  <span>=</span>
                  <input 
                    type="text" 
                    value={calc4Result}
                    readOnly
                    className="result-input"
                    onClick={() => handleCopyCalcResult(calc4Result)}
                    title="Nhấn để sao chép"
                  />
                </div>
              </div>

              {/* Calculator 5 */}
              <div className="calc-box">
                <p className="calc-title">Số X là Y% của số Z. Z là?</p>
                <div className="calc-row">
                  <span>Số</span>
                  <input 
                    type="text" 
                    value={calc5Input1}
                    onChange={(e) => {
                      const val = e.target.value
                      setCalc5Input1(val)
                      calculateCalc5(val, calc5Input2)
                    }}
                    placeholder="0"
                  />
                  <span>là</span>
                  <div className="input-with-symbol">
                    <input 
                      type="text" 
                      value={calc5Input2}
                      onChange={(e) => {
                        const val = e.target.value
                        setCalc5Input2(val)
                        calculateCalc5(calc5Input1, val)
                      }}
                      placeholder="0"
                    />
                    <span className="input-symbol">%</span>
                  </div>
                  <div className="calc-spacer"></div>
                  <span>của số</span>
                  <input 
                    type="text" 
                    value={calc5Result}
                    readOnly
                    className="result-input"
                    onClick={() => handleCopyCalcResult(calc5Result)}
                    title="Nhấn để sao chép"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {/* Left Column - Image */}
        <div className="left-column">
          <div 
            className="image-section clickable-area" 
            onClick={handleImageClick}
            title="Click để chọn ảnh hoặc Ctrl+V để paste"
          >
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Đang đọc ảnh với Google Gemini AI...</p>
              </div>
            ) : !image ? (
              <div className="empty-state">
                <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>Click để chọn ảnh</p>
                <p className="hint">hoặc Ctrl+V để paste</p>
              </div>
            ) : (
              <>
                <img src={image} alt="Invoice" />
                <button 
                  className="delete-image-btn" 
                  onClick={handleDeleteImage}
                  title="Xóa ảnh"
                >
                  ×
                </button>
              </>
            )}
          </div>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="file-input"
            className="file-input"
          />
        </div>

        {/* Right Column - Input & Results */}
        <div className="right-column">
          <div className="manual-input-compact">
            <div className="calc-header-row">
              <h3>Tính nhanh % chiết khấu</h3>
              <button 
                className="history-trigger-btn" 
                onClick={() => setShowHistory(true)}
                title="Xem lịch sử tính toán"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
              </button>
              <p className="formula-text">% CK = Tiền CK ÷ (Số lượng × Đơn giá) × 100</p>
            </div>
            <div className="calc-main-container">
              <div className="calc-label-row">
                <span className="operator-spacer"></span>
                <div className="label-item">Số lượng</div>
                <span className="operator-spacer"></span>
                <div className="label-item">Đơn giá</div>
                <span className="operator-spacer"></span>
                <span className="operator-spacer"></span>
                <div className="label-item">Tiền CK</div>
                <span className="operator-spacer"></span>
                <div className="label-item result-label">% CK</div>
              </div>
              <div className="calc-input-row">
                <span className="math-operator">(</span>
                <div className="input-wrapper-with-clear">
                  <input 
                    type="text" 
                    value={qty} 
                    onChange={(e) => setQty(e.target.value)}
                    placeholder="3"
                  />
                  {qty && (
                    <button className="clear-input-btn" onClick={() => setQty('')}>×</button>
                  )}
                </div>
                <span className="math-operator">×</span>
                <div className="input-wrapper-with-clear">
                  <input 
                    type="text" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="224.000"
                  />
                  {price && (
                    <button className="clear-input-btn" onClick={() => setPrice('')}>×</button>
                  )}
                </div>
                <span className="math-operator">)</span>
                <span className="math-operator">÷</span>
                <div className="input-wrapper-with-clear">
                  <input 
                    type="text" 
                    value={discount} 
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="60.480"
                  />
                  {discount && (
                    <button className="clear-input-btn" onClick={() => setDiscount('')}>×</button>
                  )}
                </div>
                <span className="math-operator">=</span>
                <div className="input-with-symbol result-wrapper">
                  <input 
                    type="text" 
                    value={mainCalcResult}
                    readOnly
                    className="result-input"
                    onClick={() => handleCopyCalcResult(mainCalcResult)}
                    title="Nhấn để sao chép"
                  />
                  <span className="input-symbol">%</span>
                </div>
              </div>
            </div>
          </div>

          {results.length > 0 && (
            <div className="results">
              <div className="results-header">
                <h2>Kết quả: {results.length} sản phẩm</h2>
                <button className="clear-btn" onClick={handleClearAll}>
                  Xóa tất cả
                </button>
              </div>
              
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Tiền CK</th>
                      <th>% CK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item, index) => (
                      <tr key={index}>
                        <td className="row-number">{index + 1}</td>
                        <td className="editable-cell">
                          <input
                            type="text"
                            value={item.qty}
                            onChange={(e) => handleCellEdit(index, 'qty', e.target.value)}
                            className="cell-input"
                          />
                        </td>
                        <td className="editable-cell">
                          <input
                            type="text"
                            value={item.price.toLocaleString('vi-VN')}
                            onChange={(e) => handleCellEdit(index, 'price', e.target.value)}
                            className="cell-input"
                          />
                        </td>
                        <td className="editable-cell">
                          <input
                            type="text"
                            value={item.discountAmount.toLocaleString('vi-VN')}
                            onChange={(e) => handleCellEdit(index, 'discountAmount', e.target.value)}
                            className="cell-input"
                          />
                        </td>
                        <td 
                          className="discount-percent clickable"
                          onClick={() => handleCopyPercent(item.discountPercent)}
                          title="Nhấn để sao chép"
                        >
                          {item.discountPercent.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
