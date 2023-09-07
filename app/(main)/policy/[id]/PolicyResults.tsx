"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { v4 as uuid4 } from "uuid";
import autoAnimate from "@formkit/auto-animate";
import { arrayMove } from "@dnd-kit/sortable";
import { DragEndEvent } from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type AiPolicy, savePolicy, useAiPolicy } from "@/lib";
import { Editor } from "@/components/Editor";
import { SortableContainer } from "@/components/Sortable";
import Tooltip from "@/components/Tooltip";
import UpdatedAt from "@/components/UpdatedAt";
import {
  PolicyNewSections,
  PolicySection,
  PolicySectionModifier,
  TextEditing,
} from "@/components/PolicyEditableVIew";

export default function Result({ policyId }: { policyId: string }) {
  const queryClient = useQueryClient();

  const { data } = useAiPolicy(policyId);

  const {
    createdAt,
    updatedAt,
    sections: initialSections,
    heading: initialHeading,
  } = data || {};

  const { id } = useParams();
  const [heading, setHeading] = useState<AiPolicy["heading"]>(
    initialHeading || "",
  );
  const [surveyContents, setSurveyContents] = useState<AiPolicy["sections"]>(
    initialSections || [],
  );
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const parentRef = useRef(null);
  const headerRef = useRef(null);

  const mutation = useMutation(
    ({
      serializedPayload,
      policyId,
    }: {
      serializedPayload: string;
      policyId: string;
    }) => savePolicy(serializedPayload, policyId),
    {
      onSuccess: async () => {
        await queryClient.invalidateQueries([policyId]);
        toast.success("Changes have been saved!");
      },
      onError: (error) => {
        toast.error("Something went wrong");
        throw new Error(JSON.stringify(error));
      },
    },
  );

  const handleSectionDragEvent = ({ active, over }: DragEndEvent) => {
    if (!over) {
      return;
    }

    if (active.id !== over.id) {
      const oldIndex = surveyContents.findIndex(
        (section) => section.id === active.id,
      );
      const newIndex = surveyContents.findIndex(
        (section) => section.id === over.id,
      );
      setSurveyContents(arrayMove(surveyContents, oldIndex, newIndex));
    }
  };

  const handleSubSectionDragEvent = (
    index: number,
    { over, active }: DragEndEvent,
  ) => {
    if (!over) {
      return;
    }

    const { children } = surveyContents[index];
    if (!children) return;

    if (active.id !== over.id) {
      const oldIndex = children.findIndex(
        (section) => section.id === active.id,
      );
      const newIndex = children.findIndex((section) => section.id === over.id);
      setSurveyContents((prevState) => {
        return prevState.map((section, sectionIndex) => {
          if (index === sectionIndex && section.children) {
            return {
              ...section,
              children: arrayMove(section.children, oldIndex, newIndex),
            };
          }
          return section;
        });
      });
    }
  };

  const handleDeleteSection = (sectionId: string) => {
    setSurveyContents((prevState) => {
      return prevState.filter((section) => {
        return section.id !== sectionId;
      });
    });
  };

  const handleDeleteSubSection = (
    sectionId: string,
    childSectionId: string,
    sectionIndex: number,
  ) => {
    const { children } = surveyContents[sectionIndex] || {};
    if (children && children.length === 1) {
      handleDeleteSection(sectionId);
      return;
    }

    setSurveyContents((prevState) => {
      return prevState.map((section) => {
        if (sectionId === section.id && section.children) {
          return {
            ...section,
            children: section.children.filter((subSection) => {
              return subSection.id !== childSectionId;
            }),
          };
        }
        return section;
      });
    });
  };

  const handleHeadingOnChanges = (heading: AiPolicy["heading"]): void => {
    setHeading(heading);
  };

  const handleSectionsOnChanges = (sections: AiPolicy["sections"]): void => {
    setSurveyContents(sections);
  };

  const handleUpdatePolicy = async () => {
    if (!heading || !surveyContents) return;

    const payload = {
      policy: {
        heading,
        sections: surveyContents,
      },
    };

    mutation.mutate({
      serializedPayload: JSON.stringify(payload),
      policyId,
    });
  };

  const changeIsReorderingState = () => {
    setIsReordering(!isReordering);
  };

  const AddNewSection = () => {
    // fist section is section number 0
    const currentNumber = surveyContents.length;
    const newSectionNumber = currentNumber - 2;
    const newSection = {
      id: uuid4(),
      title: `New Section - ${newSectionNumber}`,
      children: [
        {
          id: uuid4(),
          title: "New Sub Section",
          htmlContent: "<h2>New Section</h2><p>Enter your content here</p>",
        },
      ],
    };

    setSurveyContents((prevState) => {
      return [...prevState, newSection];
    });
  };

  useEffect(() => {
    parentRef.current && autoAnimate(parentRef.current);
  }, [parentRef]);

  useEffect(() => {
    headerRef.current && autoAnimate(headerRef.current);
  }, [headerRef]);

  return (
    <div className="p-[10px] px-[5px] md:px-[20px] md:pt-[39px]">
      <header
        ref={headerRef}
        className="mb-[24px] flex flex-col justify-between border-b border-[#CCCCCC] bg-white md:sticky md:top-[174px] md:z-10 md:flex-row md:items-center"
      >
        <div className="flex flex-col">
          <Editor
            content={heading}
            handleHeadingOnChanges={handleHeadingOnChanges}
            heading={heading}
            hideDeleteButton={true}
            handleUpdatePolicy={handleUpdatePolicy}
            handleDeleteSection={handleDeleteSection}
            handleDeleteSubSection={handleDeleteSubSection}
          />
          <UpdatedAt
            updatedAt={updatedAt || String(Date.now())}
            createdAt={createdAt || String(Date.now())}
          />
        </div>
        <div className="flex items-baseline justify-between md:pb-[35px]">
          <PolicySectionModifier
            surveyContents={surveyContents}
            handleSectionDragEvent={handleSectionDragEvent}
            handleSubSectionDragEvent={handleSubSectionDragEvent}
            handleDeleteSection={handleDeleteSection}
            handleDeleteSubSection={handleDeleteSubSection}
            isReordering={isReordering}
            changeIsReorderingState={changeIsReorderingState}
          />
          <TextEditing
            handleUpdatePolicy={handleUpdatePolicy}
            id={id as string}
          />
        </div>
        {isReordering && (
          <SortableContainer
            surveyContents={surveyContents}
            handleSectionDragEvent={handleSectionDragEvent}
            handleSubSectionDragEvent={handleSubSectionDragEvent}
            handleDeleteSection={handleDeleteSection}
            handleDeleteSubSection={handleDeleteSubSection}
          />
        )}
      </header>
      <article ref={parentRef}>
        <Tooltip />
        {surveyContents.map((section, sectionIndex) => (
          <PolicySection
            key={section.id}
            section={section}
            sectionIndex={sectionIndex}
            handleSectionsOnChanges={handleSectionsOnChanges}
            surveyContents={surveyContents}
            handleUpdatePolicy={handleUpdatePolicy}
            handleDeleteSection={handleDeleteSection}
            handleDeleteSubSection={handleDeleteSubSection}
          />
        ))}
      </article>
      <PolicyNewSections AddNewSection={AddNewSection} />
    </div>
  );
}
