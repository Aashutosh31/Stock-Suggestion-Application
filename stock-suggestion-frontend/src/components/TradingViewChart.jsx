import React, { useEffect, useRef } from 'react';
import { createChart, ColorType } from 'lightweight-charts';
import { useTheme } from '../context/ThemeContext';

const TradingViewChart = ({ data }) => {
  const chartContainerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current || !data || data.length === 0) {
      return;
    }

    const isDarkMode = theme === 'dark';
    const chartOptions = {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: { 
        background: { 
          type: ColorType.Solid, 
          color: isDarkMode ? '#1f2937' : '#FFFFFF'
        },
        textColor: isDarkMode ? '#D1D5DB' : '#1F2937',
      },
      grid: {
        vertLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
        horzLines: { color: isDarkMode ? '#374151' : '#E5E7EB' },
      },
      timeScale: {
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      },
      rightPriceScale: {
        borderColor: isDarkMode ? '#374151' : '#E5E7EB',
      },
    };

    chartContainerRef.current.innerHTML = '';
    const chart = createChart(chartContainerRef.current, chartOptions);

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#34D399',
      downColor: '#EF4444',
      borderDownColor: '#EF4444',
      borderUpColor: '#34D399',
      wickDownColor: '#EF4444',
      wickUpColor: '#34D399',
    });

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume_scale',
    });

    chart.priceScale('volume_scale').applyOptions({
      scaleMargins: { top: 0.75, bottom: 0 },
    });

    const chartData = data.map(item => ({
      time: item.date,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    const volumeData = data.map(item => ({
      time: item.date,
      value: item.volume,
      color: item.close > item.open ? 'rgba(52, 211, 153, 0.5)' : 'rgba(239, 68, 68, 0.5)',
    }));

    candlestickSeries.setData(chartData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.resize(entry.contentRect.width, 400);
      }
    });
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chart) {
        chart.remove();
      }
    };

  }, [data, theme]); 

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

export default TradingViewChart;