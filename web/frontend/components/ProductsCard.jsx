import React, { useState, useCallback } from "react";
import {
  Card,
  Heading,
  TextContainer,
  DisplayText,
  Spinner,
  Tag
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import styles from './style.css'
import { ProductFilters } from './ProductFilters';
import { ProductImage } from './ProductImage';
import { Variants } from './Variants';
import axios from 'axios';
import { DefaultEditor } from 'react-simple-wysiwyg';
import 'bootstrap/dist/css/bootstrap.min.css';

class Tabs extends React.Component {
  state = {
    activeTab: this.props.children[0].props.label
  }
  changeTab = (tab) => {

    this.setState({ activeTab: tab });
  };
  render() {

    let content;
    let buttons = [];
    return (
      <div className="main_content">
        {React.Children.map(this.props.children, child => {
          buttons.push(child.props.label)
          if (child.props.label === this.state.activeTab) content = child.props.children
        })}

        <TabButtons activeTab={this.state.activeTab} buttons={buttons} changeTab={this.changeTab} />
        <div className="tab-content">{content}</div>

      </div>
    );
  }
}

const TabButtons = ({ buttons, changeTab, activeTab }) => {

  return (
    <div className="tab-buttons">
      {buttons.map(button => {
        return <button className={button === activeTab ? 'active' : ''} onClick={() => changeTab(button)}>{button}</button>
      })}
    </div>
  )
}

const Tab = props => {
  return (
    <React.Fragment>
      {props.children}
    </React.Fragment>
  )
}
var realdata = [];
var filterlist = [];
var productimage = [];
var productvariant = [];
var oneproduct = [];
export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [dataset, setDataSet] = useState([]);
  const [initdata, setInitSet] = useState([]);
  const [filter, setfilters] = useState([]);
  const [value, setValue] = useState("");
  const [tagvalue, settagValue] = useState("");
  const [product_title, setproductTitle] = useState("");
  const [price, setPrice] = useState("");
  const [comparePrice, setcompare] = useState("");
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("en");
  const [product_visible, visibleProduct] = useState(false);
  const [loading, SetLoading] = useState(false);
  const [reload, SetreLoading] = useState(false);
  const [product_data, setProductSet] = useState([]);
  const [productimageid, setProductidSet] = useState([]);
  const [html, setHtml] = React.useState('');
  const [product, setProduct] = useState(false);
  const [collection, setCollection] = useState(false);
  const [isCheck, setIsCheck] = useState([]);
  const [productCheck, productIsCheck] = useState([]);
  const [variantCheck, variantIsCheck] = useState([]);
  const [list, setList] = useState([]);
  const [isShown, setIsShown] = React.useState(false);
  const [state, setState] = useState({
    filters: new Set(),
  })
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();
  const [selectedTags, setSelectedTags] = useState([]);

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const handleProductImage = useCallback(event => {
    if (event.target.checked) {
      product_data[0].medias.map((element, index) => {
        if (element.id == event.target.value) {
          productimage.push(element.id);
        }
      })
    } else {
      productimage.map((element, index) => {
        if (element == event.target.value) {
          const index1 = productimage.indexOf(event.target.value);
          if (index1 > -1) { // only splice array when item is found
            productimage.splice(index1, 1); // 2nd parameter means remove one item only
          }
        }
      })
    }
    productIsCheck(productimage.map(li => li));

  })


  const handleProductvariant = useCallback(event => {

    if (event.target.checked) {
      product_data[0].variants.map((element, index) => {
        if (element.id == event.target.value) {
          productvariant.push(element.id);
        }
      })
    } else {
      productvariant.map((element, index) => {
        if (element == event.target.value) {
          const index = productvariant.indexOf(event.target.value);
          if (index > -1) { // only splice array when item is found
            productvariant.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
      })
    }

    variantIsCheck(productvariant.map(li => li));
  })

  const handlechnageprice = useCallback(event => {
    console.log("target", event.target.value)
    product_data[0].variants.map((element, index) => {
      if (element.id == event.target.id) {
        element.price.current = event.target.value * 100;
      }
    })
  })

  const handleFilterChange = useCallback(event => {

    if (event.target.checked) {
      realdata.map((element, index) => {
        if (element.title == event.target.value) {
          filterlist.push(element.title);
        }
      })
    } else {
      realdata.map((element, index) => {
        if (element.title == event.target.value) {
          const index = filterlist.indexOf(element.title);
          if (index > -1) { // only splice array when item is found
            filterlist.splice(index, 1); // 2nd parameter means remove one item only
          }
        }
      })
    }

    console.log("filter", filterlist);
    setIsCheck(filterlist.map(li => li));
    setfilters(filterlist);
  })



  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  function onChange(e) {
    setHtml(e.target.value);
  }

  const addproduct = async () => {
    setIsLoading(true);
    SetreLoading(true)
    await fetch("/api/products/add?value=" + filter + "?" + from + "?" + to,
      {
        method: 'POST',
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(filter)
      }).then((response) => response.json())
      .then((data) => { 
        if(data.success == true){
          SetreLoading(false);
          setIsShown(false);
          setIsCheck([]);
          setToastProps({ content: "products imported!" });
        }
       });
  };

  const editProduct = async () => {

    await fetch("/api/products/create?value=" + value,
      {
        method: "POST",
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: value
        }),
      }
    ).then((response) => response.json())
      .then((data) => {
        oneproduct = data.items;
        console.log("one", oneproduct);
        visibleProduct(true)
        setHtml(data.items[0].description);
        setSelectedTags(data.items[0].tags)
        setProductSet(data.items);
        setproductTitle(data.items[0].title)
        productimage = data.items[0].medias.map(li => li.id);
        productIsCheck(data.items[0].medias.map(li => li.id));
        productvariant = data.items[0].variants.map(li => li.id);
        variantIsCheck(data.items[0].variants.map(li => li.id));
      });
  }

  const removeTag = useCallback(
    (tag) => () => {
      setSelectedTags((previousTags) =>
        previousTags.filter((previousTag) => previousTag !== tag),
      );
    },
    [],
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    await fetch("/api/products/create?value=" + value,
      {
        method: "POST",
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: value
        }),
      }
    ).then((response) => response.json())
      .then((data) => {

        setDataSet(data.items);
        setInitSet(data.items);
        realdata = data.items
      });
    setIsShown(true)
  };

  const import_one = async () => {
    SetLoading(true)
    var new_product = oneproduct;
    console.log("new_product", new_product);
    new_product[0].description = html;
    new_product[0].title = product_title;
    new_product[0].tags = selectedTags;
    console.log("updated", new_product)
    setIsLoading(true);
    await fetch("/api/products/addone", {
      method: "POST",
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(new_product)
    }).then((response) => response.json())
      .then((data) => { console.log(data)
        if(data.success == true){
          SetLoading(false);
          setIsShown(false);
          setToastProps({ content: "One product imported!" });
        }
      });

  }

  const inputChange = (e) => {
    setValue(e.target.value);
    console.log('CHANGE', e.target.value);
    
      setProduct(true)
  
    
      setCollection(true)
   

  }

  const tolanguage = (e) => {
    console.log('CHANGE', e.target.value);
    setTo(e.target.value)
  }

  const allproduct = async (e) => {
    SetLoading(true)
    setIsCheck(dataset.map(li => li.title));
    await fetch("/api/products/addall?value="+ to,
      {
        method: 'POST',
        mode: "cors",
        headers: new Headers({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(filter)
      }).then((response) => response.json())
      .then((data) => { 
        setToastProps({ content: "All products imported!" });
        SetLoading(false);
        setIsShown(false);
        setIsCheck([]);
        console.log(data) });
  }

  const allselect = () => {
    setIsCheck(dataset.map(li => li.title));
    realdata.map((element, index) => {
      filterlist.push(element.title);
    })
    setfilters(filterlist);
  }

  const hide = () => setIsShown(false);

  const addtag_value = (e) => {
    settagValue(e.target.value);
  }

  const changetitle = (e) => {
    setproductTitle(e.target.value);
  }

  const changeprice = (e) => {
    setPrice(e.target.value);
  }

  const compare_price = (e) => {
    setcompare(e.target.value);
  }

  const addtag = () => {
    setSelectedTags(selectedTags => [...selectedTags, tagvalue])
  }

  const filterList = (e) => {
    console.log('CHANGE', e.target.value);
    var updatedList = initdata;
    updatedList = updatedList.filter(function (item) {
      return item.title.toLowerCase().search(
        e.target.value.toLowerCase()) !== -1;
    });
    setDataSet(updatedList);
  }
  return (
    <>
      {toastMarkup}
      <Tabs>
        <Tab label="One Product">
          <div className="header">
            <h2>Copy One product</h2>
            <p>Copy products from any shopify stoer with a single click</p>
          </div>
          <div className="action_part">
            <input className="get_url" placeholder="Enter the product URL of Shopify Store" onChange={inputChange} type='text' name='url' />
            <div className="button_part">
              <button type="button" disabled={!collection} onClick={handlePopulate} className="import_button">Import Product</button>
              <button type="button" disabled={!product} onClick={editProduct} className="edit_botton">Edit Product</button>
            </div>
          </div>
          {product_data.length > 0 &&
            <div id="fields-holder" className="jq-sortable-list ui-sortable">
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group"><label for="productTitle" className="productInfoLabel">Title</label>
                    <input type="text" placeholder={product_data[0].title} id="productTitle" onChange={changetitle} className="form-control" />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 colPlace">
                  <div className="form-group"><label className="productInfoLabel">Price</label>
                    <input type="text" placeholder={product_data[0].variants[0].price.current / 100} onChange={changeprice} className="form-control" />
                  </div>
                </div>
                <div className="col-md-6 colPlace">
                  <div className="form-group"><label className="productInfoLabel">Compare at price</label>
                    <input type="text" placeholder={product_data[0].variants[0].price.previous / 100} onChange={compare_price} className="form-control" />
                  </div>
                </div>
              </div>
              <DefaultEditor value={html} onChange={onChange} />
              <div className="image_section">
                <label className="productInfoLabel">Images {product_data.length > 0 && <span>({productimage.length})</span>} </label>
                <ProductImage
                  isCheck={productCheck}
                  productdata={product_data}
                  onProductImage={handleProductImage} />
              </div>
              <div className="variant_section">
                <label className="productInfoLabel">Product variants <span>({product_data[0].variants.length})</span></label>
                <Variants
                  isCheck={variantCheck}
                  productdata={product_data}
                  onFilterChange={handleProductvariant}
                  onchangeprice={handlechnageprice} />
              </div>
              <div className="row tag_section">
                <div className="col-md-12">
                  <div className="form-group">
                    <label className="productInfoLabel">Tags</label>
                    <div className="tag_part">
                      <input type="text" className="form-control" onChange={addtag_value} />
                      <button type="button" className="btn" onClick={addtag}>Add</button>
                    </div>
                    <span className="tagBadge">
                      {selectedTags.map((option) => (
                        <Tag key={option} onRemove={removeTag(option)}>
                          {option}
                        </Tag>
                      ))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group"><label className="productInfoLabel">URL handle</label>
                    <input type="text" placeholder="Handle" value={value} className="form-control" />
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <button type="button" disabled={loading} className="poky-btn poky-btn-primary" onClick={import_one}>Import Product {loading &&<Spinner accessibilityLabel="Small spinner example" size="small" />}</button>
                  </div>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <div className="form-group">
                    <button type="button" className="poky-btn poky-btn-secondary">Cancel</button>
                  </div>
                </div>
              </div>

            </div>
          }

        </Tab>
        <Tab label="Multi Product">
          <div className="header">
            <h2>Multi products import</h2>
            <p>Copy products from any shopify stoer with a single click</p>
          </div>
          <div className="action_part">
            <input className="get_url" placeholder="Enter the product URL of Shopify Store" onChange={inputChange} type='text' name='url' />
            <div className="button_part">
              <button type="button" disabled={!collection} onClick={handlePopulate} className="import_button">Import Product</button>
              <button type="button" disabled={!product} onClick={editProduct} className="edit_botton">Edit Product</button>
            </div>
          </div>
        </Tab>
      </Tabs>
      {isShown &&
        < div className="modal1">
          <div className="modal_header">
            <h2>Select Products</h2>
            <div className="language_part">
                <select onChange={tolanguage}>
                  <option value="en">English</option>
                  <option value="ar">Arabic</option>
                  <option value="be">Bulgarian</option>
                  <option value="ca">Croatian</option>
                  <option value="cs">Czech</option>
                  <option value="da">Danish</option>
                  <option value="nl">Dutch</option>
                  <option value="et">Estonian</option>
                  <option value="fi">Finnish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="el">Greek</option>
                  <option value="hu">Hungarian</option>
                  <option value="it">Italian</option>
                  <option value="lv">Latvian</option>
                  <option value="lt">Lithuanian</option>
                  <option value="mt">Maltese</option>
                  <option value="pl">Polish</option>
                  <option value="pt">Portuguese</option>
                  <option value="ro">Romanian</option>
                  <option value="sk">Slovak</option>
                  <option value="sl">Slovenian</option>
                  <option value="es">Spanish</option>
                  <option value="sv">Swedish</option>
                </select>
            </div>

          </div>
          <form>
            <fieldset className="form-group">
              <input type="text" className="form-control form-control-lg" placeholder="Search" onChange={filterList} />
            </fieldset>
          </form>
          <ProductFilters
            isCheck={isCheck}
            categories={dataset}
            onFilterChange={handleFilterChange} />
          <div className="footer_buttons">
            <p>{filter.length} selected</p>
            <button className="all_import"  disabled={loading} onClick={allproduct}>{loading ?<Spinner accessibilityLabel="Small spinner example" size="small" />:<div>Auto import all products</div>}</button>
            <button  className="select_all" onClick={allselect}>Select all</button>
            <button className="cancel" onClick={hide}>Cancel</button>
            <button disabled={filter.length == 0 || reload} className="import_button" onClick={addproduct}>{reload ?<Spinner accessibilityLabel="Small spinner example" size="small" />:<div>Import</div>}</button>
          </div>
        </div>
      }
    </>
  );
}
