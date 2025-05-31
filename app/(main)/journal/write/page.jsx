"use client";
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form';
import 'react-quill-new/dist/quill.snow.css';
import { zodResolver } from "@hookform/resolvers/zod"
import { journalSchema } from '@/app/lib/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getMoodById, MOODS } from '@/app/lib/mood';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BarLoader } from 'react-spinners';
import { createCollection, getCollections } from '@/actions/collection';
import CollectionForm from '@/components/collection-dialog';
import { createJournalEntry } from '@/actions/journal';

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const JournalEnryPage = () => {
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  const {
    loading: actionLoading,
    fn: actionfn,
    data: actionResult,
  } = useFetch(createJournalEntry);

  const {
    loading: collectionsLoading,
    data: collections,
    fn: fetchCollections,
  } = useFetch(getCollections);


  const {
    loading: createCollectionLoading,
    fn: createCollectionFn,
    data: createdCollection,
  } = useFetch(createCollection);

  const router = useRouter();

  const { register, handleSubmit, control, formState: { errors }, getValues,setValue } = useForm({
    resolver: zodResolver(journalSchema),
    defaultValues: {
      title: '',
      content: '',
      mood: '',
      collectionId: '',
    },
  });

  useEffect(()=>{
    fetchCollections();
  },[]);
  useEffect(() => {
    if (actionResult && !actionLoading) {
      router.push(
        `/collection/${actionResult.collectionId ? actionResult.collectionId : "unorganized"
        }`
      );
      toast.success(`Entry created successfully`);
    }
  }, [actionResult, actionLoading]);
  const onSubmit = handleSubmit(async (data) => {
    const mood = getMoodById(data.mood);
    
    actionfn({
      ...data,
      moodScore: mood.score,
      moodQuery: mood.pixabayQuery,
      
    })
    
  });
  
  useEffect(()=>{
    if(createdCollection){
        setIsCollectionDialogOpen(false);
        fetchCollections();
        setValue("collectionId", createdCollection.id);
        toast.success(`Collection ${createdCollection.name} created!`)
    }
  },[createdCollection]);
  const handleCreateCollection = async (data) =>{
    createCollectionFn(data)
  };
  const isLoading = actionLoading || collectionsLoading;
  return (
    <div className='container mx-auto px-4 py-8'>
      <form className='space-y-2 mx-auto' onSubmit={onSubmit}>
        <h1 className='text-5xl md:text-6xl gradient-title'>
          What&apos;s on your mind?
        </h1>
        {isLoading && <BarLoader color='orange' width={"100%"} />}

        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Title
          </label>
          <Input
            disabled={isLoading}
            {...register("title")}
            placeholder="Give your entry a title..."
            className={`py-5 md:text-md ${errors.title ? "border-red-500" : ""}`}
          />
          {errors.title && (
            <p className="text-red-500 text-sm">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">How are you feeling?</label>
          <Controller
            name="mood"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className={errors.mood ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a mood..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(MOODS).map((mood) => {
                      return (
                        <SelectItem key={mood.id} value={mood.id}>
                          <span className="flex items-center gap-2">
                            {mood.emoji} {mood.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.mood && (
            <p className="text-red-500 text-sm">{errors.mood.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {getMoodById(getValues("mood"))?.prompt ?? "Write your thoughts..."}
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <ReactQuill readOnly={isLoading}
                theme='snow'
                value={field.value}
                onChange={field.onChange}
                modules={{
                  toolbar: [
                    [{ font: [] }],
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: "ordered" }, { list: "bullet" }, { list: 'check' }],
                    [{ align: [] }],
                    [{ color: [] }, { background: [] }],
                    ["blockquote", "code-block"],
                    ["link"],
                    ["clean"],
                  ]
                }}
              />
            )}
          />

          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>
        <div className='space-y-2'>
          <label className='text-sm font-medium'>
            Add to collection(option)
          </label>
          <Controller
            name="collectionId"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={(value)=>{
                  if(value==="new"){
                    setIsCollectionDialogOpen(true);
                    }else{
                      field.onChange(value);
                  }
                }} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a collection..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collections?.map((collection) => {
                      return (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.name}
                        </SelectItem>
                      );
                    })}
                    <SelectItem value='new'>
                      <span className='text-orange-600'>
                        + create New Collection
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              );
            }}
          />
          {errors.content && (
            <p className="text-red-500 text-sm">{errors.content.message}</p>
          )}
        </div>
        <div className='space-y-4 flex'>
          <Button type="submit" variant="journal"
          disabled={actionLoading}
          >
            publish
          </Button>

        </div>


      </form>
      <CollectionForm 
      loading={createCollectionLoading}
      onSuccess={handleCreateCollection}
      open={isCollectionDialogOpen}
      setOpen={setIsCollectionDialogOpen}
      />

    </div>
  )
};

export default JournalEnryPage