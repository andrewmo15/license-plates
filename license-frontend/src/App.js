import React, { useState } from 'react'
import useMutation from './hooks/useMutation'
import { useQuery } from './hooks/useQuery'
import { Carousel } from 'react-responsive-carousel';
import 'react-responsive-carousel/lib/styles/carousel.min.css';

const validFileTypes = ['image/jpg', 'image/jpeg', 'image/png']
const URL = process.env.REACT_APP_API_URL

function App() {
  const [refetch, setRefetch] = useState(false)
  const {
    mutate: uploadImage,
    isLoading: uploading,
    error: uploadError,
  } = useMutation({ url: URL })
  const {
    mutate: deleteImage,
    isLoading: deleting,
    error: deleteError,
  } = useMutation({ url: URL, method: "DELETE" })
  const { 
    data: imageURLs=[],
    isLoading: imageLoading,
    error: imageError,
  } = useQuery(URL, refetch)
  const [error, setError] = useState("")
  const [currImage, setCurrImage] = useState(0)

  const handler = async e => {
    const file = e.target.files[0]
    if (!validFileTypes.find(type => type === file.type)) {
      setError("File must be in JPG/PNG format")
      return
    }
    const form = new FormData()
    form.append('image', file)
    await uploadImage(form)
    setTimeout(() => {
      setRefetch(s => !s)
    }, 1000)
  }

  const deleteClicked = async () => {
    await deleteImage({key: imageURLs[currImage][0]})
    setTimeout(() => {
      setRefetch(s => !s)
    }, 1000)
  }
  return (
    <div>
      <input 
      type="file"
      cursor="pointer"
      onChange={handler}/>
      <p> {error} </p>
      <p> {uploadError} </p>
      <p> {imageError} </p>
      <Carousel onChange={e => setCurrImage(e)}>
        {imageURLs && imageURLs.map(data => <img key={data[0]} src={data[1]}/>)}
      </Carousel>
      <button onClick ={deleteClicked}> Delete </button>
    </div>
  );
}

export default App;
