/** Simple table component for CRUD pages. */
import React from 'react';
export default function Table({columns, rows}){ return <table style={{width:'100%',borderCollapse:'collapse'}}><thead><tr>{columns.map(c=><th key={c} style={{textAlign:'left',borderBottom:'1px solid #ddd'}}>{c}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j} style={{padding:'6px 0',borderBottom:'1px solid #f3f4f6'}}>{v}</td>)}</tr>)}</tbody></table>; }
