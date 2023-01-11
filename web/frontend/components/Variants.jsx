import { useState } from "react";

export function Variants(props) {
    const {
        productdata,
        isCheck,
        onFilterChange,
        onchangeprice,
    } = props
    console.log(productdata)
    
    return (

        <section
            className="filters"
            aria-labelledby="filters-header">

            <ul className="product_list col-md-12">
                <div className="row">
                    {productdata[0].variants.map(category => (
                        <li key={category.id} className="col-md-12" >
                            <div>

                                <div className="_2oiCL">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <input
                                                onChange={onFilterChange}
                                                type="checkbox"
                                                value={category.id}
                                                checked={isCheck.includes(category.id)} />
                                            <span>{category.title}</span>
                                        </div>
                                        <div className="col-md-6">
                                            <input type="text" placeholder={category.price.current/100} onChange={onchangeprice} id={category.id} className="form-control" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </div>
            </ul>
        </section>
    )
}