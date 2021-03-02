import { NextPage } from 'next'
import Link from 'next/link'
import { useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import PrimaryButton from '~/components/Button/PrimaryButton'
import SecondaryAnchorButton from '~/components/Button/SecondaryAnchorButton'
import SecondaryButton from '~/components/Button/SecondaryButton'
import FormGroup from '~/components/FormGroup'
import Head from '~/components/Head'
import Heading from '~/components/Heading'
import Label from '~/components/Label'
import TextField from '~/components/TextField'
import TrainerCard from '~/components/TrainerCard'
import { actions, getTrainerIds, getUmamusumes } from '~/store'
import { Trainer, Umamusume } from '~/types'
import { trainerConverter } from '~/utils/converter'
import { firestore } from '~/utils/firebase'

type SeaarchValues = {
  representative: Umamusume['id']
  support: Umamusume['id']
}

const TRAINES_PER_FETCH = 2

const Page: NextPage = () => {
  const dispatch = useDispatch()
  const umamusumes = useSelector(getUmamusumes)
  const trainerIds = useSelector(getTrainerIds)
  const lastDocRef = useRef<firebase.default.firestore.QueryDocumentSnapshot<Trainer>>()
  const queryRef = useRef<firebase.default.firestore.Query<Trainer>>()

  const { handleSubmit, register } = useForm<SeaarchValues>({
    defaultValues: {
      representative: '',
      support: '',
    },
  })

  const handleClickNextButton = useCallback(async () => {
    const { docs, query } = await firestore()
      .collection('trainers')
      .orderBy('createdAt', 'desc')
      .withConverter(trainerConverter)
      .startAfter(lastDocRef.current)
      .limit(TRAINES_PER_FETCH)
      .get()
    const trainers = docs.map((doc) => doc.data())
    dispatch(actions.insertTrainers(trainers))
    lastDocRef.current = docs[docs.length - 1]
    queryRef.current = query
  }, [])

  const submitSearchForm = useCallback(async (values: SeaarchValues) => {
    const representativeId = umamusumes?.find(({ name }) => name === values.representative)?.id
    const supportId = umamusumes?.find(({ name }) => name === values.support)?.id
    let trainerQuery = firestore()
      .collection('trainers')
      .orderBy('createdAt', 'desc')
      .limit(TRAINES_PER_FETCH)
      .withConverter(trainerConverter)

    if (representativeId) {
      trainerQuery = trainerQuery.where('representativeId', '==', representativeId)
    }
    if (supportId) {
      trainerQuery = trainerQuery.where('supportId', '==', supportId)
    }

    trainerQuery.get().then(({ docs, query }) => {
      const trainers = docs.map((doc) => doc.data())
      dispatch(actions.updateTrainers(trainers))
      lastDocRef.current = docs[docs.length - 1]
      queryRef.current = query
    })
  }, [])

  useEffect(() => {
    firestore()
      .collection('trainers')
      .orderBy('createdAt', 'desc')
      .limit(TRAINES_PER_FETCH)
      .withConverter(trainerConverter)
      .get()
      .then(({ docs, query }) => {
        const trainers = docs.map((doc) => doc.data())
        dispatch(actions.updateTrainers(trainers))
        lastDocRef.current = docs[docs.length - 1]
        queryRef.current = query
      })
  }, [])

  return (
    <>
      <Head />
      <section className="mb-10">
        <Heading>募集</Heading>
        <form
          className="px-3 flex flex-col items-center mb-6"
          onSubmit={handleSubmit(submitSearchForm)}
        >
          <FormGroup>
            <Label htmlFor="representative">代表ウマ娘</Label>
            <TextField
              className="w-full"
              id="representative"
              list="representative-list"
              {...register('representative')}
            />
            <datalist id="representative-list">
              <option value="未選択" />
              {umamusumes?.map((umamusume) => (
                <option key={umamusume.id} value={umamusume.name} />
              ))}
            </datalist>
          </FormGroup>
          <FormGroup>
            <Label htmlFor="support">育成サポート</Label>
            <TextField
              className="w-full"
              id="support"
              list="support-list"
              {...register('support')}
            />
            <datalist id="support-list">
              <option value="未選択" />
              {umamusumes?.map((umamusume) => (
                <option key={umamusume.id} value={umamusume.name} />
              ))}
            </datalist>
          </FormGroup>
          <PrimaryButton type="submit">検索</PrimaryButton>
        </form>
        <div className="mb-6 flex justify-center">
          <Link href="/new" passHref>
            <SecondaryAnchorButton>新しい募集を作る</SecondaryAnchorButton>
          </Link>
        </div>
        <ul className="px-3 pb-8">
          {trainerIds.map((trainerId) => (
            <li key={trainerId} className="mb-6">
              <TrainerCard trainerId={trainerId} />
            </li>
          ))}
        </ul>
        <div className="mb-6 flex justify-center">
          <SecondaryButton onClick={handleClickNextButton}>もっと見る</SecondaryButton>
        </div>
      </section>
    </>
  )
}

export default Page
