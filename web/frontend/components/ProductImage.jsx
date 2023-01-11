import { useState } from "react";

export function ProductImage(props) {
    const {
        productdata,
        isCheck,
        onProductImage,
    } = props
    console.log(productdata)
    return (
        <section
            className="filters"
            aria-labelledby="filters-header">

            <ul className="product_list col-md-12">
                <div className="row">
                    {productdata[0].medias.map(category => (
                        <li key={category.id} className="col-md-3" >
                            <label className="product">
                                <input
                                    onChange={onProductImage}
                                    type="checkbox"
                                    value={category.id}
                                    checked={isCheck.includes(category.id)} />
                                <img src={category.url} className="one_productImage" />
                            </label>
                        </li>
                    ))}
                </div>
            </ul>
        </section>
    )
}