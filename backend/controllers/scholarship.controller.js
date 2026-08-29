import { Scholarship } from "../models/scholarship.model.js";

const COURSE_ALIASES = {
  ug: ["ug", "undergraduate", "bachelor", "bachelors", "under-graduate", "degree"],
  pg: ["pg", "postgraduate", "master", "masters", "post-graduate"],
  btech: ["b.tech", "btech", "bachelor of technology", "b.e", "engineering"],
  mtech: ["m.tech", "mtech", "master of technology"],
  bsc: ["b.sc", "bsc", "bachelor of science"],
  mba: ["mba", "m.b.a", "master of business administration"],
  "class 12": ["12th", "class 12", "class xii", "10+2"]
};
 
const CATEGORY_ALIASES = {
  women: ["girl", "girls", "female", "women"],
  "sc/st": ["sc", "st", "dalit", "tribal"],
  pwd: ["pwd", "disabled", "handicapped"]
};
 
function resolveAlias(keyword, taxonomyMap) {
  const kw = keyword.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(taxonomyMap)) {
    if (aliases.includes(kw)) return canonical;
  }
  return null;
}

export const postscholarship =async (req,res)=>{
    try {
        const {title,description ,special_cat,amount,location,s_Type,grants,gpa,course, deadline,apply_link,companyId} =req.body;
        const userId =req.id;
        if(!title || !description || !special_cat || !amount || !location || !s_Type || !grants|| !gpa|| !course ||!deadline|| !apply_link || !companyId){
            return res.status(400).json({
                message:"something is missing",
                success:false
            });
        }
        const scholarship= await Scholarship.create({
            title,
            description,
            special_cat:special_cat.split(","),
            amount:amount,
            location,
            s_Type, 
            grants,
            gpa,
            course:course.split(","),
            deadline,
            apply_link,
            company:companyId,
            created_by:userId
        });
        return res.status(201).json({
            message:"new scholarship created",
            scholarship,
            success:true
        });
    } catch (error) {
         console.log(error);
    }
}

export const getAllscholarships =async (req,res)=>{
    try{
        const keyword=req.query.keyword ||"";
        const courseTag = resolveAlias(keyword, COURSE_ALIASES);
        const catTag = resolveAlias(keyword, CATEGORY_ALIASES);
        const searchTerms = [keyword, courseTag, catTag].filter(Boolean);
        let t=0;
        if(keyword==1 ||keyword==2 || keyword==3 || keyword==4){
               t=1;
        }
        let query; 
            if(!t){
                        query ={
                $or:[
                    {title:{$regex:keyword,$options:"i"}},  // here i is use so that it become case sensetive
                    {description:{$regex:keyword,$options:"i"}},
                    {eligibility:{$regex:keyword,$options:"i"}},
                    { course: { $in: searchTerms } },
                    { special_cat: { $in: searchTerms } },
                    { course: { $elemMatch: { $regex: "All courses", $options: "i" } } }
                ]
              };
            }else{
                query={ 
                    $or:[
                         {gpa:{$regex:keyword,$options:"i"}},
                    ] 
                };
            }
       
      const scholarships =await Scholarship.find(query).populate({
        path:"company"
      }).sort({createdAt:-1});
      if(!scholarships){
        return res.status(400).json({
            message:"scholarship not found",
            success:false
        });
      }
      return res.status(201).json({ 
        scholarships,
        success:true
    });
    }catch(error){
        console.log(error);
    }
}

export const getscholarshipById =async(req,res)=>{
    try {
        const scholarshipId =req.params.id;
        const scholarship =await Scholarship.findById(scholarshipId).populate({
            path:"applications"
        });
        if(!scholarship){
            return res.status(400).json({
                message:"scholarship not found",
                success:false
            });
        }
        return res.status(201).json({ 
            scholarship,
            success:true
        });
    } catch (error) {
        console.log(error);
    }
}


export const getAdminscholarships =async(req,res)=>{
    try {
       const adminId=req.id;
       const scholarships =await Scholarship.find({created_by:adminId}).populate({
          path:'company',
          createdAt:-1
       });  
       if(!scholarships){
        return res.status(400).json({
            message:"scholarship not found",
            success:false
        });
       }
       return res.status(201).json({ 
        scholarships,
        success:true
       });
    } catch (error) {
        console.log(error);
    }
}