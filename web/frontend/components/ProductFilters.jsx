import { useState } from "react";

export function ProductFilters(props) {
    const { 
      categories,
      isCheck,
      onFilterChange,
    } = props
    console.log(isCheck)
    return (
    
      <section 
        className="filters"
        aria-labelledby="filters-header">
    
        <ul className="product_list">
          
          {categories.map(category => (
            <li key={category.title}>
              <label className="product">
                <input 
                  onChange={onFilterChange}
                  type="checkbox"
                  value={category.title}
                  checked={isCheck.includes(category.title)} />
                <img className="productImage" src={category.medias[0].url} />
                <div className="product_info">
                    <p>{category.title}</p>
                </div>
              </label>
            </li>
          ))}
        </ul>
      </section>
    )
  }